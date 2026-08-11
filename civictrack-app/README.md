## CivicTrack

A simple full-stack web app for citizens to **report civic issues** and for administrators to **manage and resolve complaints**.

This implementation uses:
- **Frontend**: React + Vite + React Router + Tailwind CSS
- **Backend**: Node.js (Express)
- **Database**: MySQL (via `mysql2`/connection pool)

> Note: The original spec mentioned MongoDB, but the current working implementation uses **MySQL**. All code and setup instructions below assume MySQL.

---

## Features

- **Citizen side**
  - Home page with quick actions.
  - **Report Issue** page:
    - Upload photo (stored on server disk under `/uploads`).
    - Auto-detected geolocation via HTML5 Geolocation API.
    - Editable latitude/longitude.
  - **Track Complaints** page:
    - List of complaints for demo user `user_id = 1`.
    - Shows photo, description, lat/lng, status, department and created time.
    - Simple **Google Maps embed** for location preview.

- **Admin side**
  - Admin login (JWT based).
  - Admin dashboard:
    - Table of all complaints (photo, description, location, status, department).
    - Filter by **status** and **department**.
    - Update status and department.
    - Reject/delete complaint (also removes photo file if present).
    - Simple analytics cards (totals by status).

- **Backend**
  - REST APIs for complaints and admin auth.
  - File upload with `multer`.
  - JWT-based protection for admin complaint endpoints.
  - MySQL DB with seed/demo data.

---

## Folder structure

```text
civictrack-app/
  client/         # React + Vite frontend
  server/         # Node.js + Express backend
```

Key files:
- `client/src/main.jsx` – app entry + routing.
- `client/src/pages/*` – main screens.
- `client/src/lib/api.js` – citizen-side API helpers.
- `client/src/lib/adminApi.js` – admin API helpers.
- `client/src/context/AdminAuthContext.jsx` – admin auth state (JWT).
- `server/src/index.js` – Express app entry.
- `server/src/routes/api.auth.js` – admin login route.
- `server/src/routes/api.complaints.js` – complaints CRUD/filter.
- `server/src/lib/db.js` – MySQL pool.
- `server/db/seed.sql` – demo data for users/admins/complaints.

---

## Prerequisites

- **Node.js** 18+ (recommended).
- **MySQL** server running locally (or reachable via network).

---

## Backend setup (`server`)

1. **Install dependencies**

   ```bash
   cd server
   npm install
   ```

2. **Create MySQL database**

   In your MySQL client:

   ```sql
   CREATE DATABASE civictrack;
   USE civictrack;
   ```

   Then create required tables (example schema):

   ```sql
   -- users
   CREATE TABLE IF NOT EXISTS users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );

   -- admins
   CREATE TABLE IF NOT EXISTS admins (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );

   -- complaints
   CREATE TABLE IF NOT EXISTS complaints (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     description TEXT,
     photo_url VARCHAR(512),
     latitude DOUBLE,
     longitude DOUBLE,
     status ENUM('Pending','In Progress','Resolved') DEFAULT 'Pending',
     department VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

3. **Environment variables**

   Copy the example file and fill in values:

   ```bash
   cd server
   cp .env.example .env
   ```

   `server/.env.example` contains:

   ```text
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=civictrack

   # secret used to sign admin JWTs (change in production!)
   JWT_SECRET=dev-secret-change-me

   # folder for uploaded images (served at /uploads)
   UPLOAD_DIR=uploads
   ```

4. **Seed demo data**

   From `server/`:

   ```bash
   # Make sure DB_* vars in .env are correct first
   npm run db:seed
   ```

   This uses `server/db/seed.sql` to insert:
   - User: `Akshat <akshat@example.com>`
   - Admin: `akshat <akshatvision7@gmail.com>` / `Akshat@2004`
   - Some sample complaints.

5. **Run backend in dev mode**

   ```bash
   cd server
   npm run dev
   ```

   The server will listen on **http://localhost:3000**.

   - Health check: `GET http://localhost:3000/health`
   - Uploaded images are served from `http://localhost:3000/uploads/...`.

---

## Frontend setup (`client`)

1. **Install dependencies**

   ```bash
   cd client
   npm install
   ```

2. **Environment variables (optional)**

   By default the client talks to `http://localhost:3000`.  
   To override:

   ```bash
   cp .env.example .env
   ```

   `client/.env.example`:

   ```text
   # Base URL of backend API
   VITE_API_BASE=http://localhost:3000
   ```

3. **Run frontend**

   ```bash
   cd client
   npm run dev
   ```

   Vite will show a URL like `http://localhost:5173/`.

4. **Open the app**

   - Citizen side: `http://localhost:5173/`
   - Admin login: `http://localhost:5173/admin/login`

---

## API reference

Base URL (backend): `http://localhost:3000`

- **POST** `/api/complaints`
  - Citizen submits complaint (multipart/form-data).
  - Body:
    - `user_id` (string/int, required)
    - `description` (string, optional if photo present)
    - `latitude` (number, optional)
    - `longitude` (number, optional)
    - `department` (string, optional)
    - `photo` (file, optional)
  - Response: created complaint JSON.

- **GET** `/api/complaints/user/:id`
  - Citizen gets their own complaints list.
  - Auth: none in this demo (uses numeric `user_id`).

- **GET** `/api/complaints`
  - Admin lists all complaints.
  - Query params:
    - `status` (`Pending` | `In Progress` | `Resolved`, optional)
    - `department` (string, optional)
  - Auth: `Authorization: Bearer <admin_jwt>`.

- **PUT** `/api/complaints/:id`
  - Admin updates `status` and/or `department`.
  - Body (JSON):
    - `status` (`Pending` | `In Progress` | `Resolved`, optional)
    - `department` (string, optional)
  - Auth: `Authorization: Bearer <admin_jwt>`.

- **DELETE** `/api/complaints/:id`
  - Admin rejects/deletes complaint (and its photo file if any).
  - Auth: `Authorization: Bearer <admin_jwt>`.

- **POST** `/api/auth/admin/login`
  - Admin login.
  - Body (JSON):
    - `email`
    - `password`
  - Response:
    - `{ "token": "<jwt_here>" }`

---

## Example curl commands

### Health check

```bash
curl http://localhost:3000/health
```

### Admin login

```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

### Submit complaint (citizen, with description only)

```bash
curl -X POST http://localhost:3000/api/complaints \
  -F "user_id=1" \
  -F "description=Pothole near sector 18 gate" \
  -F "latitude=28.626" \
  -F "longitude=77.210"
```

### Submit complaint with photo

```bash
curl -X POST http://localhost:3000/api/complaints \
  -F "user_id=1" \
  -F "description=Streetlight not working" \
  -F "photo=@/path/to/photo.jpg"
```

### List complaints for user

```bash
curl http://localhost:3000/api/complaints/user/1
```

### Admin: list all complaints

```bash
curl "http://localhost:3000/api/complaints?status=Pending" \
  -H "Authorization: Bearer <your_admin_jwt>"
```

### Admin: update complaint

```bash
curl -X PUT http://localhost:3000/api/complaints/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_admin_jwt>" \
  -d '{"status":"Resolved","department":"Roads"}'
```

### Admin: delete complaint

```bash
curl -X DELETE http://localhost:3000/api/complaints/1 \
  -H "Authorization: Bearer <your_admin_jwt>"
```

---

## Screen flow (ASCII sketch)

```text
Citizen flow
============

 [Home (/)]
    |
    |-- "Report an Issue" --> [Report Issue (/report)]
    |                             |
    |                             |-- submit form
    |                             v
    |                        [Success message]
    |
    |-- "Track Complaints" --> [Track Complaints (/track)]
                                  - list of user's complaints
                                  - status badges (Pending / In Progress / Resolved)
                                  - map snippet for each complaint


Admin flow
==========

 [Admin Login (/admin/login)]
        |
        |-- valid credentials
        v
 [Admin Dashboard (/admin)]
        |
        |-- filters: status / department
        |-- table:
        |     - complaint ID, photo, description
        |     - location (lat/lng + map)
        |     - status, department (editable)
        |     - actions: Save / Reject
        |
        `-- (optional analytics)
              - cards: total, pending, in progress, resolved
```

---

## Notes / TODOs

- For production, you **must**:
  - Use a strong `JWT_SECRET`.
  - Secure the API with proper CORS and HTTPS.
  - Replace demo user-id based tracking with real user auth/registration.
  - Consider moving image storage to S3/Cloudinary or similar.

