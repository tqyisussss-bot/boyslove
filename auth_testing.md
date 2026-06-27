# Auth-Gated App Testing Playbook — Boys Love

## Step 1 — Create test user & session in Mongo

```bash
mongosh --eval "
use('test_database');
var userId = 'user_' + Math.random().toString(36).slice(2,14);
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'tqyisussss@gmail.com',
  name: 'Admin Test',
  picture: '',
  is_admin: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('SESSION_TOKEN=' + sessionToken);
"
```

## Step 2 — Hit the backend
```bash
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" -H "Authorization: Bearer <SESSION_TOKEN>"
curl -X GET "$REACT_APP_BACKEND_URL/api/series"
curl -X POST "$REACT_APP_BACKEND_URL/api/series" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Bad Buddy","country":"Thailand","year":2021,"synopsis":"Rival families, secret romance","genres":["Romance","Comedia"],"status":"completed","featured":true}'
```

## Step 3 — Browser test (Playwright)
```python
await page.context.add_cookies([{
  "name":"session_token","value":"<SESSION_TOKEN>",
  "domain":"<host without scheme>","path":"/",
  "httpOnly": True, "secure": True, "sameSite":"None"
}])
await page.goto(f"{REACT_APP_BACKEND_URL}/home")
```

## Success indicators
- `/api/auth/me` returns user with `is_admin=true` for the admin email.
- `/home`, `/mylist`, `/admin` load without redirect to `/login`.
- Series and episode CRUD work via admin endpoints.

## Failure indicators
- 401 on `/api/auth/me`
- Redirect to `/login`
- 403 on admin endpoints from non-admin
