# vessel-ops

Inventory + maintenance management for vessels.

## Monorepo
- `apps/api` — FastAPI + Postgres
- `apps/web` — Next.js
- `apps/mobile` — Expo

## Local dev

### Postgres
```bash
docker compose up -d
export DATABASE_URL="postgresql+psycopg://vessel:vessel@localhost:5432/vessel_ops"
```

### API
```bash
cd apps/api
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Web
```bash
cd apps/web
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`. Make sure the API is running first.
