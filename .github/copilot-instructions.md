# Copilot Instructions — Nomadia

Nomadia is an accommodation rental marketplace (Airbnb-style) connecting hosts and guests. The UI is in **Portuguese (pt-BR)**; all code, comments, and variable names are in **English**.

## Architecture

Monorepo with two independent apps:

- **`backend/`** — NestJS 11 (TypeScript), runs on port **3001**
- **`frontend/`** — Next.js 16 with App Router (TypeScript), runs on port **3000**

The backend currently uses **in-memory mock data** (no database). All state lives in service classes and resets on restart. Mock data is in `backend/src/common/mock-data.ts`.

### Backend modules

Each module follows the NestJS `Controller → Service → Module` pattern:

| Module | Route prefix | Purpose |
|--------|-------------|---------|
| `auth` | `/v1/auth` | Register, login, refresh, logout (JWT) |
| `users` | `/v1/users` | Profile management, public profiles |
| `properties` | `/v1/properties` | CRUD for property listings, search/filter |
| `bookings` | `/v1/bookings` | Create, list, cancel reservations |

Shared types and interfaces live in `backend/src/common/types.ts`.

### Frontend structure

- **Pages**: `src/app/` — Next.js App Router (file-based routing)
- **Feature components**: `src/components/{auth,booking,layout,properties}/`
- **UI primitives**: `src/components/ui/` — shadcn/ui (New York style, Lucide icons)
- **State**: React Context via `src/lib/auth-context.tsx` (`useAuth` hook)
- **API client**: `src/lib/api.ts` — typed fetch wrapper for all backend endpoints
- **Types**: `src/lib/types.ts` — mirrors backend interfaces
- **Path alias**: `@/*` maps to `./src/*`

## Build, Lint, and Test

### Backend (`cd backend`)

```sh
npm run build          # nest build
npm run lint           # eslint --fix
npm run format         # prettier --write
npm run test           # jest (unit tests)
npm run test -- --testPathPattern=auth   # run tests for a single module
npm run test:cov       # jest --coverage
npm run test:e2e       # jest --config ./test/jest-e2e.json
npm run start:dev      # nest start --watch (dev server)
```

### Frontend (`cd frontend`)

```sh
npm run build          # next build
npm run lint           # eslint
npm run test           # jest
npm run test -- --testPathPattern=PropertyCard   # run a single test
npm run test:cov       # jest --coverage
npm run dev            # next dev (dev server)
```

## Authentication

- **Strategy**: JWT with access + refresh tokens via Passport (`@nestjs/passport`)
- **Access token**: short-lived, sent as `Authorization: Bearer <token>`
- **Refresh tokens**: stored in an in-memory Map in `AuthService`
- **Guard**: `@UseGuards(AuthGuard('jwt'))` on protected endpoints
- **Frontend**: tokens stored in `localStorage`, managed by `AuthProvider` context

## User Roles (RBAC)

Six roles with escalating permissions: `guest`, `host`, `moderator`, `support`, `admin`, `super_admin`. Key rules:

- **Guests** can book, review, and message — cannot create listings
- **Hosts** must verify identity before listing — max 100 properties
- **Admins** require MFA for high-impact operations

## Code Style

### Backend

- **Prettier**: single quotes, trailing commas (`all`)
- **ESLint**: TypeScript ESLint + Prettier plugin; `no-explicit-any` is OFF; `no-floating-promises` is WARN
- Decorators and metadata emission enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- `strictNullChecks: true`, `noImplicitAny: false`

### Frontend

- **ESLint**: `eslint-config-next` with core-web-vitals and TypeScript rules
- **TypeScript**: strict mode enabled
- **Styling**: Tailwind CSS v4 with `tw-animate-css`; use `cn()` from `@/lib/utils` for conditional classes
- **UI components**: add via `npx shadcn@latest add <component>` — do not manually create files in `components/ui/`

## Conventions

- API routes are versioned under `/v1/`
- Backend DTOs use inline body types (e.g., `@Body() body: { email: string }`) — no separate DTO class files
- Pagination follows the `PaginatedResponse<T>` interface (defined in `common/types.ts`)
- Booking price = `(nights × nightly_rate) + cleaning_fee + service_fee + taxes`
- Frontend test setup mocks `next/navigation`, `next/image`, `next/link`, and `localStorage` (see `src/test-setup.tsx`)
- Tests go in `__tests__/` directories colocated with the code they test (frontend) or as `.spec.ts` files next to source (backend)
