# 🌐 streamsphere

<p align="center">
  <strong>A production-ready video streaming platform built with modern technologies</strong>
</p>

<p align="center">
  Next.js • Express • PostgreSQL • Redis • MinIO • FFmpeg • HLS Streaming
</p>

---

## ✨ Features

### 🎥 Video Platform
- **Upload & Process** — Upload videos with automatic transcoding to 240p, 480p, 720p, 1080p
- **HLS Streaming** — Adaptive bitrate streaming with quality selection
- **Video Player** — Custom player with seek, volume, fullscreen, quality picker
- **Thumbnails** — Auto-generated video thumbnails

### 👤 User System
- **JWT Auth** — Register, login, token refresh, role-based access
- **Channels** — User profiles with banner, avatar, subscriber counts
- **Subscriptions** — Subscribe to channels, subscription feed

### 💬 Engagement
- **Comments** — Threaded comments with replies
- **Likes** — Like/Dislike toggle with counts
- **Notifications** — Real-time notification system
- **Playlists** — Create and manage playlists

### 🔍 Discovery
- **Search** — Full-text video search with sorting
- **Trending** — Most popular videos of the week
- **Recommendations** — Tag-based video recommendations
- **Categories** — Browse by category

### 🛡️ Admin Panel
- **Dashboard** — Platform-wide analytics
- **User Management** — Role assignment, user moderation
- **Content Moderation** — Video management and removal

### 🎨 UI/UX
- **Dark Mode** — Elegant dark theme design
- **Responsive** — Mobile-first responsive layout
- **Animations** — Smooth transitions and micro-animations
- **YouTube-like** — Familiar navigation with sidebar, chips, video cards

---

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│              Next.js Frontend           │
│    (React, Tailwind CSS, HLS.js)       │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│           Express Backend API           │
│     (TypeScript, Prisma, JWT)          │
└──┬──────────┬──────────┬───────────────┘
   │          │          │
   ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────────┐
│ PG   │  │Redis │  │  MinIO   │
│  DB  │  │Cache │  │ Storage  │
└──────┘  └──────┘  └────┬─────┘
                         │
                    ┌────▼─────┐
                    │   CDN    │
                    └──────────┘
```

### Video Processing Pipeline

```
Upload → Validate → Store Original → FFmpeg Transcode
    ↓
Generate Thumbnails
    ↓
Create HLS Playlists (240p/480p/720p/1080p)
    ↓
Upload to MinIO → Available for Streaming
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- FFmpeg (for local development)

### Option 1: Docker Compose (Recommended)

```bash
# Clone and enter directory
cd youtube-ui

# Start all services
docker-compose up -d

# Open in browser
# Frontend: http://localhost:3000
# API:      http://localhost:5000/api/health
# MinIO:    http://localhost:9001 (admin/minioadmin)
```

### Option 2: Local Development

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis minio

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Setup database
cd ../server
npx prisma migrate dev
npx prisma db seed

# 4. Start backend
npm run dev

# 5. Start frontend (new terminal)
cd ../client
npm run dev
```

### Default Credentials

| User | Email | Password |
|------|-------|----------|
| Admin | admin@streamsphere.com | admin123456 |
| Demo | techguru@example.com | password123 |
| Demo | creativearts@example.com | password123 |
| Demo | musicvibes@example.com | password123 |

---

## 📁 Project Structure

```
youtube-ui/
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   │   ├── page.tsx      # Home
│   │   │   ├── watch/        # Video player
│   │   │   ├── upload/       # Upload page
│   │   │   ├── search/       # Search results
│   │   │   ├── trending/     # Trending videos
│   │   │   ├── channel/      # Channel page
│   │   │   ├── subscriptions/
│   │   │   ├── history/
│   │   │   └── auth/         # Login/Register
│   │   ├── components/       # React Components
│   │   │   ├── layout/       # Navbar, Sidebar
│   │   │   └── video/        # VideoCard, VideoPlayer
│   │   └── lib/              # API client, stores, utils
│   ├── Dockerfile
│   └── tailwind.config.js
├── server/                    # Express Backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   ├── src/
│   │   ├── config/           # DB, Redis, MinIO config
│   │   ├── middleware/       # Auth, upload, rate limiting
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── utils/            # JWT, validators, helpers
│   │   └── index.ts          # Server entry point
│   └── Dockerfile
├── k8s/                       # Kubernetes manifests
├── docker-compose.yml
└── .env
```

---

## 🔌 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/profile | Get current user profile |
| PUT | /api/auth/profile | Update profile |

### Videos
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/videos/feed | Get video feed |
| GET | /api/videos/trending | Get trending videos |
| GET | /api/videos/search | Search videos |
| POST | /api/videos/upload | Upload a video |
| GET | /api/videos/:id | Get video details |
| PUT | /api/videos/:id | Update video |
| DELETE | /api/videos/:id | Delete video |
| POST | /api/videos/:id/like | Like/Dislike video |

### Channels
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/channels/:id | Get channel info |
| GET | /api/channels/:id/videos | Get channel's videos |
| POST | /api/channels/:id/subscribe | Subscribe/Unsubscribe |

### Comments
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/comments/video/:id | Get video comments |
| POST | /api/comments/video/:id | Post comment |
| DELETE | /api/comments/:id | Delete comment |

---

## 🐳 Deployment

### Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/manifests.yaml

# Check status
kubectl -n streamsphere get pods
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Express, TypeScript, Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Video | FFmpeg, HLS.js |
| Auth | JWT, bcrypt |
| Validation | Zod |
| State | Zustand |
| Deployment | Docker, Kubernetes |

---

## 📄 License

MIT © streamsphere
