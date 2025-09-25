## CivicTrack

Crowdsourced civic issue reporting and resolution.

### Folder Structure

```
/civictrack-app
  /client            # React (Vite) frontend with Tailwind CSS
  /server            # Node.js (Express) backend with MySQL
  README.md          # Project overview and setup instructions
```

### Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8+

### Frontend (client)

1. Install dependencies:

```
cd client
npm install
```

2. Run dev server:

```
npm run dev
```

App runs on `http://localhost:5173`.

### Backend (server)

1. Create environment file:

```
cd server
copy ENV_EXAMPLE .env
```

2. Install dependencies:

```
npm install
```

3. Start server (with auto-reload in dev):

```
npm run dev
```

Server runs on `http://localhost:3000`. Health check: `GET /health`.

### Database

Create the MySQL database specified in `.env` (default `civictrack`). Example:

```
CREATE DATABASE civictrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Apply schema (from `server/db/schema.sql`):

```
mysql -u root -p < server/db/schema.sql
```

Seed demo data:

```
cd server
npm run db:seed
```

### API Documentation

Base URL: `http://localhost:3000`

- Auth
  - POST `/api/auth/admin/login` → { token }
    - body: { email, password }

- Complaints
  - POST `/api/complaints` (multipart)
    - fields: user_id (required), description (optional if photo present), latitude, longitude, department, photo(file)
  - GET `/api/complaints/user/:id`
  - GET `/api/complaints` (admin, Bearer token)
    - query: status, department
  - PUT `/api/complaints/:id` (admin, Bearer token)
    - body: { status?: 'Pending'|'In Progress'|'Resolved', department?: string|null }

Curl examples:

```
# Login (admin)
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'

# Submit complaint (public)
curl -X POST http://localhost:3000/api/complaints \
  -F "user_id=1" -F "description=Pothole near gate" \
  -F "latitude=28.626" -F "longitude=77.210" \
  -F "photo=@C:/path/to/photo.jpg"

# List user's complaints
curl http://localhost:3000/api/complaints/user/1

# Admin list (with token)
curl http://localhost:3000/api/complaints \
  -H "Authorization: Bearer TOKEN"

# Update complaint
curl -X PUT http://localhost:3000/api/complaints/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress","department":"Roads"}'
```


### Notes

- Tailwind is configured to scan `index.html` and files in `src/`.
- Vite config in `client/vite.config.js` sets dev port to 5173.
- MySQL connection uses a pooled client via `server/src/lib/db.js`.


