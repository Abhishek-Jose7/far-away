# Transit Infrastructure Intelligence

A collaborative, production-grade hackathon foundation designed for monitoring public transit assets and predicting outages before they occur. 

This repository implements a monorepo setup running on **Cloudflare Workers (Hono, D1, Queues, KV)** on the backend and **Next.js 15 (App Router, Tailwind, Zustand, TanStack Query)** on the frontend.

---

## Workspace Structure

```text
transit-intelligence/
├── apps/
│   ├── web/               # Next.js 15 App Router Frontend
│   └── worker/            # Hono API Worker & Queue Consumer
├── packages/
│   ├── database/          # D1 SQLite Migrations and Seed Data scripts
│   ├── scoring-engine/    # Deterministic verification & prediction calculations
│   └── types/             # Shared TypeScript models and API payloads
├── docs/                  # API endpoints and payload schemas
└── wrangler.toml          # Cloudflare configuration bindings
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
Initialize the packages and workspaces from the root of the workspace:
```bash
npm install
```

### 2. Compile Common Packages
Build the shared types and prediction engine packages:
```bash
npm run build --workspace=packages/types
npm run build --workspace=packages/scoring-engine
```

### 3. Setup Local D1 Database & Seeds
Create and apply migrations and seed data to your local sqlite instance:
```bash
# Apply schema tables
npm run db:migrate:local

# Seed with 120+ Mumbai records
npm run db:seed:local
```

### 4. Run Servers
Spin up both the Hono backend worker (on port `8787`) and the Next.js frontend (on port `3000`):
```bash
# Start Cloudflare Worker (Runs API + Queue consumers locally)
npm run dev:worker

# Start Next.js App
npm run dev:web
```

---

## Production Deployment (Hackathon Guide)

### 1. Cloudflare D1 Setup
Generate your remote databases:
```bash
# 1. Create databases
wrangler d1 create transit-dev
wrangler d1 create transit-prod

# 2. Update the DB ID bindings inside wrangler.toml
# Replace database_id = "..." for both environments.
```

Deploy tables and seeds to Cloudflare production network:
```bash
# Apply migrations to production database
wrangler d1 migrations apply transit-prod --remote

# Apply seeds
wrangler d1 execute transit-prod --remote --file=packages/database/migrations/0002_seed_mumbai.sql
```

### 2. Deploy Cloudflare Worker API
Deploy your Worker API and Queue consumers directly to Cloudflare edge:
```bash
npm run deploy --workspace=apps/worker
```

### 3. Deploy Frontend to Vercel
Deploy your Next.js project on Vercel:
- **Root Directory**: `apps/web` (or root with directory override).
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: The deployed Cloudflare Worker URL.
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Auth Key.
  - `CLERK_SECRET_KEY`: Clerk Secret Key.

---

## Team Development Structure & Hand-offs

- **Johann (Frontend Lead)**:
  - Focus on styling: Customize `apps/web/src/app/globals.css` and page templates.
  - Add page navigation routes in `apps/web/src/app/`.
- **Kevin (Map Systems)**:
  - Replace the vector SVG map in `apps/web/src/app/page.tsx` with MapLibre GL tiles using the provided integration instructions.
- **Aaron (Reporting System)**:
  - Expand reporting and validation. Connects directly to `POST /api/reports`.
- **Anaay (Data & QA)**:
  - Add additional migrations/seeds in `packages/database/migrations` and run validation checks.
- **Abhishek (Lead Architect)**:
  - Manages Worker bindings, Queue limits, KV cache TTL settings, and Vercel/Cloudflare integration.
