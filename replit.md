# RentalHub

RentalHub helps customers discover trustworthy equipment rentals and gives owners a clear workspace for listings, pricing, and maintenance.

## Run & Operate

- `pnpm run dev` — run the API and RentalHub web app
- `pnpm --filter @workspace/api-server run dev` — run the API server alone
- `pnpm run seed` — initialize the Phase 1 demo data
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `SESSION_SECRET` for cookie JWTs. Optional `MONGODB_URI` enables the MongoDB connection path.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, Mongoose schema definitions, development memory adapter
- DB: MongoDB/Mongoose contract with optional local-memory preview fallback
- Validation: Zod
- API codegen: Orval from `lib/api-spec/openapi.yaml`
- Build: esbuild

## Where things live

- `artifacts/api-server/src/routes/rentalhub.ts` — Phase 1 API routes
- `artifacts/api-server/src/services/store.ts` — seeded development adapter and domain records
- `artifacts/api-server/src/models/schemas.ts` — Mongoose models, indexes, and soft-delete fields
- `artifacts/rentalhub/src/App.tsx` — Phase 1 routes and UI
- `lib/api-spec/openapi.yaml` — API source of truth
- `docs/PROGRESS.md` — phase status and page inventory

## Architecture decisions

- Phase 1 keeps a Mongo-first schema contract but uses an in-memory adapter when no `MONGODB_URI` is present so a fresh preview is immediately usable.
- Auth uses bcrypt hashes and JWT access/refresh cookies; the client relies on browser cookie credentials.
- Listing uploads use Multer with a local development path and are shaped for a Cloudinary adapter in production.

## Product

Customers can browse, search, compare, and save rental equipment. Owners can manage listings and maintenance records. Admins can review users, categories, moderation counts, and audit activity.

## User preferences

- Build in the user-requested phases; Phase 2 booking and rental lifecycle is not mixed into Phase 1.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- The demo accounts use the password `RentalHub123!`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
