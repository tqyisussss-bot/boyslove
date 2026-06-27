from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends, UploadFile, File, Form
from fastapi.responses import Response as FastAPIResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@boyslove.com').strip().lower()
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
APP_NAME = os.environ.get('APP_NAME', 'boyslove')

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------------------- Storage helper ----------------------
storage_key = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------------- Models ----------------------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False
    created_at: str


class SeriesCreate(BaseModel):
    title: str
    original_title: Optional[str] = ""
    country: str = "Thailand"
    year: int = 2024
    synopsis: str = ""
    genres: List[str] = []
    poster_path: Optional[str] = ""
    backdrop_path: Optional[str] = ""
    cast: List[str] = []
    status: str = "ongoing"  # ongoing | completed
    featured: bool = False


class Series(SeriesCreate):
    id: str
    total_episodes: int = 0
    avg_rating: float = 0.0
    created_at: str
    updated_at: str


class EpisodeCreate(BaseModel):
    series_id: str
    episode_number: int
    title: str
    video_url: str
    thumbnail_path: Optional[str] = ""
    duration: int = 0  # seconds
    description: str = ""


class Episode(EpisodeCreate):
    id: str
    created_at: str


class FavoriteCreate(BaseModel):
    series_id: str


class ProgressUpdate(BaseModel):
    series_id: str
    episode_id: str
    position: int
    duration: int


class ReviewCreate(BaseModel):
    series_id: str
    rating: int  # 1-5
    comment: str = ""


# ---------------------- Auth helpers ----------------------
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    return user


async def require_user(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await get_current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await require_user(request, authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------------------- Auth Routes ----------------------
@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        r = requests.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id}, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.exception("Failed to fetch session data")
        raise HTTPException(status_code=401, detail=f"Invalid session: {e}")

    email = (data.get("email") or "").lower()
    name = data.get("name") or email
    picture = data.get("picture") or ""
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    is_admin = email == ADMIN_EMAIL
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "is_admin": is_admin}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_admin": is_admin,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token, path="/",
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 60 * 60,
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "session_token": session_token}


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(require_user)):
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------------------- Upload ----------------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


# ---------------------- Series ----------------------
@api_router.get("/series")
async def list_series(featured: Optional[bool] = None, q: Optional[str] = None, genre: Optional[str] = None):
    query = {}
    if featured is not None:
        query["featured"] = featured
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    if genre:
        query["genres"] = genre
    items = await db.series.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.post("/series")
async def create_series(payload: SeriesCreate, user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "total_episodes": 0,
        "avg_rating": 0.0,
        "created_at": now,
        "updated_at": now,
    })
    await db.series.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.get("/series/{series_id}")
async def get_series(series_id: str):
    s = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Series not found")
    return s


@api_router.put("/series/{series_id}")
async def update_series(series_id: str, payload: SeriesCreate, user: dict = Depends(require_admin)):
    update = payload.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.series.update_one({"id": series_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(404, "Series not found")
    s = await db.series.find_one({"id": series_id}, {"_id": 0})
    return s


@api_router.delete("/series/{series_id}")
async def delete_series(series_id: str, user: dict = Depends(require_admin)):
    await db.series.delete_one({"id": series_id})
    await db.episodes.delete_many({"series_id": series_id})
    return {"ok": True}


# ---------------------- Episodes ----------------------
@api_router.get("/series/{series_id}/episodes")
async def list_episodes(series_id: str):
    items = await db.episodes.find({"series_id": series_id}, {"_id": 0}).sort("episode_number", 1).to_list(1000)
    return items


@api_router.post("/episodes")
async def create_episode(payload: EpisodeCreate, user: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.episodes.insert_one(doc.copy())
    count = await db.episodes.count_documents({"series_id": payload.series_id})
    await db.series.update_one({"id": payload.series_id}, {"$set": {"total_episodes": count}})
    doc.pop("_id", None)
    return doc


@api_router.get("/episodes/{episode_id}")
async def get_episode(episode_id: str):
    e = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Episode not found")
    return e


@api_router.put("/episodes/{episode_id}")
async def update_episode(episode_id: str, payload: EpisodeCreate, user: dict = Depends(require_admin)):
    r = await db.episodes.update_one({"id": episode_id}, {"$set": payload.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(404, "Episode not found")
    e = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    return e


@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, user: dict = Depends(require_admin)):
    ep = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    await db.episodes.delete_one({"id": episode_id})
    if ep:
        count = await db.episodes.count_documents({"series_id": ep["series_id"]})
        await db.series.update_one({"id": ep["series_id"]}, {"$set": {"total_episodes": count}})
    return {"ok": True}


# ---------------------- Favorites ----------------------
@api_router.get("/favorites")
async def list_favorites(user: dict = Depends(require_user)):
    favs = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    series_ids = [f["series_id"] for f in favs]
    series = await db.series.find({"id": {"$in": series_ids}}, {"_id": 0}).to_list(1000)
    return series


@api_router.post("/favorites")
async def add_favorite(payload: FavoriteCreate, user: dict = Depends(require_user)):
    exists = await db.favorites.find_one({"user_id": user["user_id"], "series_id": payload.series_id})
    if exists:
        return {"ok": True}
    await db.favorites.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "series_id": payload.series_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api_router.delete("/favorites/{series_id}")
async def remove_favorite(series_id: str, user: dict = Depends(require_user)):
    await db.favorites.delete_one({"user_id": user["user_id"], "series_id": series_id})
    return {"ok": True}


# ---------------------- Progress ----------------------
@api_router.post("/progress")
async def update_progress(payload: ProgressUpdate, user: dict = Depends(require_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.progress.update_one(
        {"user_id": user["user_id"], "episode_id": payload.episode_id},
        {"$set": {
            "user_id": user["user_id"],
            "episode_id": payload.episode_id,
            "series_id": payload.series_id,
            "position": payload.position,
            "duration": payload.duration,
            "updated_at": now,
        }},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/progress/continue")
async def continue_watching(user: dict = Depends(require_user)):
    items = await db.progress.find({"user_id": user["user_id"]}, {"_id": 0}).sort("updated_at", -1).limit(20).to_list(20)
    # Filter incomplete
    items = [p for p in items if p.get("duration", 0) == 0 or p.get("position", 0) < p.get("duration", 0) * 0.95]
    series_ids = list({p["series_id"] for p in items})
    series = await db.series.find({"id": {"$in": series_ids}}, {"_id": 0}).to_list(1000)
    series_map = {s["id"]: s for s in series}
    result = []
    for p in items:
        s = series_map.get(p["series_id"])
        if s:
            ep = await db.episodes.find_one({"id": p["episode_id"]}, {"_id": 0})
            result.append({"progress": p, "series": s, "episode": ep})
    return result


# ---------------------- Reviews ----------------------
@api_router.get("/reviews")
async def list_reviews(series_id: str):
    items = await db.reviews.find({"series_id": series_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, user: dict = Depends(require_user)):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    now = datetime.now(timezone.utc).isoformat()
    review = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_picture": user.get("picture", ""),
        "series_id": payload.series_id,
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": now,
    }
    # Upsert per user/series
    await db.reviews.update_one(
        {"user_id": user["user_id"], "series_id": payload.series_id},
        {"$set": review}, upsert=True,
    )
    # Recompute avg
    cur = db.reviews.find({"series_id": payload.series_id}, {"_id": 0, "rating": 1})
    ratings = [r["rating"] async for r in cur]
    avg = sum(ratings) / len(ratings) if ratings else 0
    await db.series.update_one({"id": payload.series_id}, {"$set": {"avg_rating": round(avg, 2)}})
    return {"ok": True}


# ---------------------- Files (PUBLIC for posters/thumbnails) ----------------------
@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File not found")
    data, content_type = get_object(path)
    return FastAPIResponse(content=data, media_type=record.get("content_type") or content_type)


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    # Indexes
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.series.create_index("id", unique=True)
    await db.episodes.create_index("id", unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
