# SportsTalk

A full-stack sports forum where users post images with captions, like and comment, and browse current standings/results from TheSportsDB.

## Live Demo
🔗 [sportstalk-production.up.railway.app](https://sportstalk-production.up.railway.app)

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (localStorage)
- **Image storage:** Cloudinary
- **Deployment target:** Railway

## Project Layout

```
SportsTalk/
├── client/   # React + Vite frontend
└── server/   # Express + Prisma API
```

## Prerequisites

- Node.js 18+ (for native `fetch` in the sports proxy)
- A PostgreSQL database (local, Railway, Supabase, etc.)
- A Cloudinary account (free tier is fine)

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # then fill in real values
npx prisma migrate dev --name init
npm run dev
```

The API listens on `http://localhost:4000`.

Required `.env` values:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PORT` (optional, defaults to 4000)
- `CLIENT_ORIGIN` (optional, defaults to allowing any origin in dev)

### 2. Client

```bash
cd client
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api/*` to the API at port 4000 (see `vite.config.js`), so no client-side env vars are needed in development.

## API Reference

### Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{ username, email, password }` | Returns `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | Returns `{ token, user }` |

### Posts

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/posts` | optional | Newest first; includes `authorUsername`, `totalLikes`, `totalComments`, `likedByMe` |
| GET | `/api/posts/:id` | optional | Single post (same shape) |
| POST | `/api/posts` | required | multipart: `image` file + `caption` |
| DELETE | `/api/posts/:id` | required (author only) | Also deletes Cloudinary image |

### Likes

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/posts/:id/like` | required | Toggles, returns `{ liked, totalLikes }` |

### Comments

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/posts/:id/comments` | – | Newest first |
| POST | `/api/posts/:id/comments` | required | `{ body }` |

### Sports proxy

`GET /api/sports/:league` where `:league` is one of `nba`, `nfl`, `mlb`, `nhl`, `mls`. Proxies TheSportsDB free endpoints and returns either current-season standings or recent results.

## Deploying to Railway

1. Create a Postgres plugin on Railway → copy `DATABASE_URL`.
2. Create a new Railway service from the `server/` directory.
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start command: `npm start`
   - Add all env vars from `.env.example`.
3. Create a second service from the `client/` directory (or deploy to Vercel/Netlify).
   - Build command: `npm install && npm run build`
   - Serve the static `dist/` folder.
   - Set the API URL — for production, replace the `baseURL` in `client/src/api/client.js` (or convert to `import.meta.env.VITE_API_URL`) to point at the deployed API.

## Notes

- JWTs expire in 7 days; the client treats an expired token as logged-out automatically.
- Image uploads are limited to 10 MB (multer in-memory) before being streamed to Cloudinary.
- Deleting a post cascades likes and comments via the Prisma schema's `onDelete: Cascade`.
