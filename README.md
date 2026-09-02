# AssetGuard

AssetGuard is a Secure IT Asset Disposal, Data Wiping, Verification, and Recycling Management platform. Organizations use AssetGuard to securely dispose of obsolete IT assets while ensuring sensitive data is permanently erased (NIST 800-88 / DoD 5220.22-M) and regulatory compliance is maintained.

---

## Phase Overview

### Phase 1: Architecture & UI Dashboard Shell
- **Backend**: Express.js + TypeScript service with security headers (Helmet), CORS, JSON parsing, centralized error handling, and `GET /api/v1/health` endpoint.
- **Frontend**: React + TypeScript + Vite + Tailwind CSS admin dashboard shell featuring dark fixed sidebar, light content area, KPI metrics, visual asset lifecycle pipeline, status donut chart (Recharts), asset type progress breakdown, audit activity stream, and quick actions.

### Phase 3: Authentication & Role-Based Access Control (RBAC)
- **Backend Auth API**: JWT authentication (`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`) with password verification via `bcryptjs`.
- **RBAC Middlewares**: `authenticateToken` for Bearer token validation and `authorizeRoles` for role enforcement (`ADMIN`, `IT_OFFICER`, `DISPOSAL_OFFICER`).
- **Frontend Auth**: React Auth Context with persistent session handling, Axios request/response interceptors, dedicated Login page with demo quick-fills, `ProtectedRoute` wrapper, and role-aware navigation visibility in the sidebar.

---

## Tech Stack

### Frontend
- **React 18** & **TypeScript**
- **Vite** (Build tool & dev server)
- **Tailwind CSS** (Utility-first styling & custom design tokens)
- **React Router DOM v6** (Client-side routing & Protected Routes)
- **Lucide React** (Modern iconography)
- **Recharts** (SVG charts & data visualization)
- **Axios** (HTTP client with JWT interceptors)

### Backend & Database
- **Node.js** & **Express.js**
- **TypeScript** (Strict mode)
- **PostgreSQL** & **Prisma ORM**
- **JSON Web Tokens (JWT)** (Session management)
- **Bcrypt.js** (Secure credential hashing)
- **Helmet** & **CORS** (Security & cross-origin configuration)
- **Dotenv** (Environment variable management)
- **TSX** (TypeScript execution & live reloading)

---

## Project Structure

```
AssetGuard/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── AssetLifecycle.tsx
│   │   │   │   ├── AssetTypeProgress.tsx
│   │   │   │   ├── KpiGrid.tsx
│   │   │   │   ├── QuickActionButtons.tsx
│   │   │   │   ├── RecentActivityCard.tsx
│   │   │   │   └── StatusDonutChart.tsx
│   │   │   └── layout/
│   │   │       ├── DashboardLayout.tsx
│   │   │       ├── Header.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── AssetsPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DisposalPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── SanitizationPage.tsx
│   │   │   └── VerificationPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── mockData.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20260901000000_init/
│   │   │       └── migration.sql
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   └── prisma.ts
│   │   ├── controllers/
│   │   │   └── health.controller.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── notFoundHandler.ts
│   │   ├── routes/
│   │   │   ├── api.router.ts
│   │   │   └── health.router.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── typeValidation.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Database Management & Commands

### Database Commands (inside `server/`)
```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed development database
npm run db:seed

# Launch Prisma Studio GUI
npm run db:studio
```

### Demo User Accounts (Seeded)
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@assetguard.local` | `Password123!` |
| **IT Officer** | `it@assetguard.local` | `Password123!` |
| **Disposal Officer** | `disposal@assetguard.local` | `Password123!` |

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (v14+ recommended)
- npm (v9+ recommended)

### 1. Server Setup & Execution

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client & Migrate
npm run db:generate

# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

Backend will run at: `http://localhost:5000`
Health check: `http://localhost:5000/api/v1/health`

### 2. Client Setup & Execution

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Or build for production
npm run build
```

Frontend will run at: `http://localhost:5173`

---

## Verification & API Endpoints

### Health Endpoint
- **URL**: `GET /api/v1/health`
- **Response**:
```json
{
  "success": true,
  "message": "AssetGuard API is running"
}
```

### Application Routes
- `/dashboard` - Overview KPI cards, lifecycle stages, status charts, asset types breakdown, activity feed, and quick actions.
- `/assets` - Asset repository and inventory management.
- `/sanitization` - Data wiping tasks and DoD / NIST workflows.
- `/verification` - Storage verification and erasure certificate validation.
- `/disposal` - E-waste recycling batches and physical destruction log.
- `/reports` - ESG compliance, chain-of-custody, and audit export reports.
