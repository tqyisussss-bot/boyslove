# Boys Love — PRD

## Original Problem Statement
> Quiero q crees una web app llamada boys love en el cual se puedan estar subiendo capítulos de series bls como en Netflix y que usuarios puedan ver estos capítulos como si fuera Netflix pero de series asiáticas el cual tendrá apartado de administradores para ir subiendo capítulos y actualizando las series etc. tmb tendrá q pedir registro con una cuenta de google o correo electrónico

## User Choices
- Auth: Emergent-managed Google Auth
- Video storage: external URLs (YouTube, Vimeo, direct mp4)
- Image storage: Emergent Object Storage (posters, backdrops, episode thumbnails)
- Admin: pre-configured email `tqyisussss@gmail.com` (via `ADMIN_EMAIL` env)
- Extra features: Mi Lista (Favoritos), Continuar viendo (progreso), Reseñas + Calificaciones

## Architecture
- **Frontend** (React + Tailwind + shadcn UI + lucide-react + sonner + framer-motion-ready):
  Landing, Login (Google), AuthCallback (handles `#session_id`), Browse (hero + rows), SeriesDetail, Watch (YouTube/Vimeo/mp4 player + progress save), MyList, Admin (Series + Episodes CRUD).
- **Backend** (FastAPI + Motor + Mongo): `/api` routes for auth/session, series, episodes, favorites, progress, reviews, upload, file serving. Session cookie + Bearer header supported.
- **Storage**: Emergent Object Storage; files served via `/api/files/{path}` (public for media).
- **Theme**: Dark luxury (Archetype 5) with dusty-rose accent `#E07A8F`. Fonts: Cabinet Grotesk + Outfit.

## What's been implemented (2026-02)
- ✅ Google sign-in via Emergent Auth (httpOnly cookie, 7-day session)
- ✅ Admin role auto-assigned to `tqyisussss@gmail.com`
- ✅ Public series catalog, search, genre rows
- ✅ Series detail with episodes list, cast, sinopsis, ratings, reviews
- ✅ Player (YouTube / Vimeo embed + HTML5 video) with 5s-throttled progress save
- ✅ Mi Lista (favorites add/remove)
- ✅ Continue Watching row on Browse
- ✅ Reviews with star rating + recomputed `avg_rating`
- ✅ Admin panel: Series CRUD + Episodes CRUD + poster/backdrop/thumbnail uploads
- ✅ Object Storage integration verified end-to-end
- ✅ 32/32 backend tests pass

## Backlog
**P1**
- Trailer field per series + autoplay on hover (Netflix-style)
- Pagination/infinite scroll for very large catalogs
- Episode subtitle URLs (multi-language)
**P2**
- User profiles (multi-profile per account, kids profile)
- Watch history page (separate from continue)
- Notifications for new episodes of favorite series
- Email/password auth as secondary method
- Social share buttons for series

## Next Tasks
1. Seed catalog with first ~10 BL series (Bad Buddy, KinnPorsche, Cherry Magic, Semantic Error, etc.).
2. Trailer-on-hover for series cards.
3. Subtitle support in the player.
