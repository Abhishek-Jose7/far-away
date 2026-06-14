# TransitIQ Backend

A high-performance transit infrastructure reliability and predictive maintenance platform designed to monitor transit assets and predict failures before they happen.

This workspace runs on **Cloudflare Workers (Hono, D1, KV, Queues)** on the backend and is managed as a **Turborepo** monorepo with **pnpm** workspaces.

---

## Folder Structure

```text
transitiq/
├── apps/
│   ├── web/               # Next.js 15 Frontend (TypeScript + Tailwind CSS + shadcn/ui)
│   └── worker/            # Cloudflare Worker API (Hono) & Queue Consumer
├── packages/
│   ├── database/          # D1 SQLite Schema Migrations and Seed SQL
│   ├── scoring-engine/    # Deterministic health-scoring equations
│   ├── shared/            # Common Zod validation schemas
│   └── types/             # Shared TypeScript interfaces
├── docs/                  # API Contracts & Integration Guide
├── wrangler.toml          # Cloudflare configuration with D1, KV, and Queue bindings
├── package.json           # Monorepo root configuration
└── pnpm-workspace.yaml    # Workspace definition for pnpm
```

---

## Unified Agent Queue Pipeline (Single Queue)

TransitIQ simplifies asynchronous agent execution using a single queue: **`REPORT_QUEUE`** (`transitiq-report-queue`). When a report is submitted via `POST /api/reports`, the worker enqueues the processing job.

The queue consumer executes the following workflow sequentially:
1. **Verification Agent**: Counts recent reports for the asset in the past 24 hours to scale report confidence (commuter reports scale from `0.5` to `0.95`; operators/admins get immediate `1.0` confidence).
2. **Prediction Agent**: Computes the asset's reliability metrics using the deterministic scoring formula.
3. **History Agent**: Appends the snapshot to the `infrastructure_status_history` table for rendering trend lines on the dashboard.
4. **Alert Agent**: Generates a critical predictive alert in the database if the failure probability exceeds `0.70`, ignoring duplicates to prevent alert fatigue.
5. **KV Cache Invalidation**: Clears the dashboard cached stats inside `TRANSIT_KV`.

---

## Tuned Scoring Engine Math

The scoring engine isolated in `@transitiq/scoring-engine` evaluates reliability using three direct factors:

1. **Health Score (0 - 100)**:
   $$\text{health} = 100 - \text{maintenancePenalty} - \text{reportPenalty} - \text{confidencePenalty}$$
   - **`maintenancePenalty`**: $0.1$ points per day since the last maintenance check (capped at $30$ points).
   - **`reportPenalty`**: Direct impact of active reports scaled by reporter confidence (low severity = $10$, medium = $25$, high = $50$; capped at $60$ points).
   - **`confidencePenalty`**: Uncertainty risk premium for unconfirmed citizen claims, calculated as $\text{basePenalty} \times (1 - \text{confidence}) \times 0.3$ (capped at $20$ points).

2. **Failure Probability (0.00 - 1.00)**:
   $$\text{failureProbability} = (\text{healthDeficit} \times 0.60) + (\text{criticalThreatRatio} \times 0.30) + (\text{maintenanceNeglectRatio} \times 0.10)$$
   - **`healthDeficit`**: Normalized score deficit $(100 - \text{health}) / 100$.
   - **`criticalThreatRatio`**: $1.0$ if there is an active high-severity report, otherwise $0.0$.
   - **`maintenanceNeglectRatio`**: Days since maintenance normalized over a full year (capped at $1.0$).

---

## Setup & Running Locally

### 1. Install pnpm
If you do not have `pnpm` installed globally:
```bash
npm install -g pnpm
```

### 2. Install Workspace Dependencies
```bash
pnpm install
```

### 3. Build Common Workspaces
Compile TypeScript types, Zod schemas, and scoring equations:
```bash
pnpm build
```

### 4. Initialize Local D1 Database
Apply schema migrations and seed exactly 104 Mumbai assets (Dadar, Andheri, Kurla, CSMT, Ghatkopar, Thane):
```bash
# Apply schema tables & seeds (applied automatically sequentially as local migrations)
pnpm db:migrate:local
```

### 5. Run API Server & Queue Consumer
Run the local Wrangler dev server (which emulates Hono Workers, D1 databases, KV namespaces, and Queues locally):
```bash
pnpm dev:worker
```
The Worker API server will start on `http://127.0.0.1:8787`. Queue listeners will process enqueued reports in the background.

---

## Production Deployment Checklist

### 1. Create databases on Cloudflare
Create the dev and production D1 databases:
```bash
wrangler d1 create transitiq-dev
wrangler d1 create transitiq-prod
```
Update the `database_id` property of both bindings in `wrangler.toml` with the generated database IDs.

### 2. Create KV namespace on Cloudflare
Create the production KV namespace for dashboard caching:
```bash
wrangler kv:namespace create TRANSIT_KV
wrangler kv:namespace create TRANSIT_KV --preview
```
Update the `id` property under `[[kv_namespaces]]` (dev) and `[[env.production.kv_namespaces]]` (prod) in `wrangler.toml`.

### 3. Deploy Migrations and Seeds to Cloudflare Production D1
Apply migrations (both schema and seeds) to the remote Cloudflare production database:
```bash
pnpm --filter worker db:migrate:prod
```

### 4. Deploy Worker API & Queue Handlers
Deploy Hono API and consumer to Cloudflare Edge:
```bash
pnpm --filter worker deploy
```
