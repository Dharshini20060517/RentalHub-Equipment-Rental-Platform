# RentalHub

RentalHub is an equipment rental marketplace connecting customers with owners and rental businesses. Phase 1 covers marketplace discovery, role-based accounts, listing management, wishlists, maintenance records, and admin oversight. Phase 2 will add the centralized booking and rental lifecycle engine.

## Run locally

```bash
pnpm install
pnpm run dev
```

The API runs through the managed API workflow and the React application runs at the root preview. The Phase 1 memory store is used when `MONGODB_URI` is not configured, so the demo is immediately usable; MongoDB schemas and indexes are defined in `artifacts/api-server/src/models/schemas.ts` for connecting to MongoDB or Atlas.

Demo accounts use the password `RentalHub123!`:

- Admin: `admin@rentalhub.local`
- Owner: `maya@rentalhub.local`
- Customer: `jordan@rentalhub.local`

## Scripts

- `pnpm run dev` — run the API and web packages in parallel
- `pnpm run seed` — initialize the demo dataset
- `pnpm run typecheck` — check shared libraries and app packages
- `pnpm run build` — typecheck and build packages
- `pnpm run lint` — run the repository quality check

## Phase 1 surface

Customer: Home, Search, Equipment Detail, Compare, Wishlist, Login/Register/Reset, Profile.

Owner: My Listings, Listing Form, Maintenance.

Admin: Users, Categories, Moderation, Audit Log.

## Security notes

Authentication uses bcrypt password hashes and JWT access/refresh tokens stored in httpOnly cookies. Helmet, CORS credentials, rate limiting, Zod request validation, role guards, ownership checks, soft deletion, and audit records protect the core routes. Uploads enforce image MIME types and an 8 MB per-file limit. Cloudinary environment variables are reserved for the production upload adapter; local development stores uploaded files under `uploads/`.