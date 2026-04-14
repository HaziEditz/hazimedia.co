# Hazi Media

## Overview

Full-stack SaaS platform for a digital marketing agency. Users can sign up, log in, and submit Instagram promotion requests. Features a public marketing landing page, JWT-based authentication, and a protected dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `hazi-media`, preview path: `/`)
- **API framework**: Express 5 (artifact: `api-server`, preview path: `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt (bcryptjs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project Structure

### Frontend (`artifacts/hazi-media/`)
- `/` — Public landing page (hero, services, results, testimonials, CTA)
- `/login` — Login page
- `/register` — Registration page
- `/dashboard` — Protected dashboard with stats
- `/dashboard/orders` — User's order history
- `/dashboard/order-promotion` — Submit new promotion order
- `/dashboard/settings` — Account settings

### Backend (`artifacts/api-server/`)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user (protected)
- `POST /api/orders` — Submit promotion order (protected)
- `GET /api/orders` — List user orders (protected)
- `GET /api/orders/:id` — Get specific order (protected)
- `GET /api/dashboard/summary` — Dashboard stats (protected)

### Database (`lib/db/`)
- `users` table — id, name, email, password_hash, created_at
- `orders` table — id, user_id, instagram_link, message, package_type, status, created_at
- `messages` table — id, order_id, user_id, content, message_type (text|payment_request), created_at

### Shared Libraries
- `lib/api-spec/openapi.yaml` — Single source of truth for API contracts
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Auth Flow

- JWT tokens stored in `localStorage` as `hazi_token`
- `Authorization: Bearer <token>` header on all protected API calls
- Tokens expire in 7 days
- Protected routes redirect to `/login` when unauthenticated

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/hazi-media run dev` — run frontend locally

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — JWT signing secret
- `PORT` — Server port (auto-assigned per artifact)
- `BASE_PATH` — Frontend base path (auto-assigned)
