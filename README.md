# SentimentFlow — Backend

The secure API layer for [SentimentFlow](https://github.com/Wistly7/SentimentFlow-Frontend) — a startup sentiment analysis platform. Built with **Express.js**, **TypeScript**, and **Prisma**.

> **Frontend Repo →** [Wistly7/SentimentFlow-Frontend](https://github.com/Wistly7/SentimentFlow-Frontend)

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **JWT Authentication** | Secure signup/login with hashed passwords (bcryptjs) and JWT tokens |
| **Role-Based Access Control** | Middleware enforces `User` vs `Admin` permissions on protected routes |
| **Dashboard Statistics** | Complex aggregated queries — weekly article counts, sentiment trends, Share of Voice, and more |
| **Company Analysis** | Per-company metrics including sentiment moving averages and competitor comparisons |
| **Advanced Search & Pagination** | Server-side pagination via Prisma `skip`/`take` with full-text search support |
| **Structured Logging** | Winston with daily file rotation for production-grade observability |
| **Input Validation** | Request schemas validated with Zod middleware |

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Runtime** | Node.js, Express.js 5, TypeScript |
| **ORM** | Prisma (with Prisma Accelerate support) |
| **Database** | PostgreSQL |
| **Auth** | JWT (`jsonwebtoken`), bcryptjs |
| **Validation** | Zod |
| **Logging** | Winston, Winston Daily Rotate File, Morgan |
| **Deployment** | Vercel (serverless) |

---

## 🗄️ Database Schema

```
┌──────────┐       ┌────────────┐       ┌───────────────────┐
│  Sector  │──1:N──│  Startups  │──M:N──│     Articles      │
│          │       │            │       │                   │
│  id      │       │  id        │       │  id               │
│  name    │       │  name      │       │  title            │
└──────────┘       │  sectorId  │       │  content          │
                   │  imageUrl  │       │  publishedAt      │
                   └────────────┘       │  url              │
                         │              └───────────────────┘
                         │                       │
                         └──────┐   ┌────────────┘
                                ▼   ▼
                       ┌─────────────────────┐
                       │ ArticlesSentiment    │
                       │  (Junction Table)    │
                       │                     │
                       │  articleId           │
                       │  startupId           │
                       │  sentiment           │
                       │  positiveScore       │
                       │  negativeScore       │
                       │  neutralScore        │
                       └─────────────────────┘

┌──────────┐
│   User   │
│          │
│  id      │
│  name    │
│  email   │
│  roleId  │
└──────────┘
```

---

## 🏗️ System Architecture

This backend is the **Secure Guardian** in a 3-tier architecture:

```
Browser  ──▶  Next.js (BFF Proxy)  ──▶  Express.js API  ──▶  PostgreSQL
                                         (this repo)
                                              ▲
                                              │
                                    Python ETL Service
                                   (writes sentiment data)
```

- The **Next.js frontend** proxies all user requests through its server-side API routes, attaching a secret API key.
- This backend is the **only service** that talks to the database.
- The **Python ETL service** runs on a schedule to fetch news, perform sentiment analysis, and write results to the database.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database

### Installation

```bash
git clone https://github.com/Wistly7/SentimentFlow-Backend.git
cd SentimentFlow-Backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sentiment_db"
PORT=8000
SECRET_KEY="your-jwt-secret-key"
NODE_ENV="development"
```

### Database Setup

```bash
# Generate the Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name "init"
```

### Run

```bash
npm run dev
```

The API will be live at **http://localhost:8000**.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Migration history
│   └── sql/                 # Raw SQL queries
├── src/
│   ├── index.ts             # App entry point
│   ├── config/
│   │   └── prisma.ts        # Prisma client setup
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── companyAnalysisController.ts
│   │   ├── dashboardStatsController.ts
│   │   ├── searchController.ts
│   │   └── uploader.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts # JWT verification & RBAC
│   │   ├── httpLogger.ts     # Morgan + Winston integration
│   │   └── zodMiddleware.ts  # Zod schema validation
│   ├── routes/
│   │   ├── authRoute.ts
│   │   ├── companyAnalysis.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── searchRoutes.ts
│   │   └── uploader.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   └── logger.ts        # Winston logger config
│   └── types/
│       ├── all.ts
│       ├── express/          # Express type extensions
│       └── zod/              # Zod schema types
├── vercel.json               # Vercel deployment config
├── tsconfig.json
└── package.json
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev server with hot-reload (via tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start the production server |
| `npm run db:generate` | Regenerate the Prisma client |

---

## 🔗 Related Repositories

| Repository | Description |
| :--- | :--- |
| [SentimentFlow-Frontend](https://github.com/Wistly7/SentimentFlow-Frontend) | Next.js dashboard — UI, BFF proxy, and client-side data layer |
| [SentimentFlow-V2](https://github.com/SoumilMalik24/SentimentFlow-V2) | Python ETL service — news fetching, sentiment analysis, and data loading |

---

## 📜 License

This project is licensed under the ISC License.
