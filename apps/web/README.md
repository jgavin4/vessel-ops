# dock-ops Web Dashboard

Next.js web application for managing vessels, inventory, and maintenance.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** for styling
- **TanStack Query** for data fetching
- **Sonner** for toast notifications
- Custom UI components (shadcn/ui style)

## Setup

### Prerequisites

- Node.js 18+ and npm
- The FastAPI backend running at `http://localhost:8000`

### Installation

1. Install dependencies:

```bash
cd apps/web
npm install
```

2. Create environment file (optional):

```bash
cp .env.local.example .env.local
```

By default, the app uses Next.js rewrites to proxy API calls to `http://localhost:8000/api/*` via `/api/*`, so you typically don't need to set `NEXT_PUBLIC_API_BASE_URL`. If you need to override the API URL, set it in `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

**Note:** Make sure the FastAPI backend is running at `http://localhost:8000` before starting the web app.

### Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Features

### Dashboard (`/`)

- View all vessels in a grid layout
- Each vessel card shows:
  - Name
  - Make/Model/Year (if available)
  - Location (if available)
  - "View" button to navigate to detail page
- "Add Vessel" button opens a modal form
- Empty state when no vessels exist

### Vessel Detail Page (`/vessels/[id]`)

- **Overview Tab:**
  - Display all vessel details
  - Edit location and description inline
  - Save changes with toast notifications

- **Inventory Tab:** (Coming soon)
  - Placeholder for inventory requirements and checks

- **Maintenance Tab:** (Coming soon)
  - Placeholder for maintenance tasks and logs

- **Comments Tab:** (Coming soon)
  - Placeholder for vessel notes

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Dashboard
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles
│   │   └── vessels/
│   │       └── [id]/
│   │           └── page.tsx  # Vessel detail page
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── header.tsx   # App header
│   │   └── providers.tsx # Query client provider
│   └── lib/             # Utilities
│       ├── api.ts       # API client functions
│       └── utils.ts     # Helper functions
├── next.config.js       # Next.js configuration (API rewrites)
├── tailwind.config.ts   # TailwindCSS configuration
└── package.json
```

## API Integration

The app communicates with the FastAPI backend at `/api/vessels`:

- `GET /api/vessels` - List all vessels
- `POST /api/vessels` - Create a vessel
- `GET /api/vessels/{id}` - Get vessel details
- `PATCH /api/vessels/{id}` - Update vessel

API calls are proxied through Next.js rewrites to avoid CORS issues in development.
