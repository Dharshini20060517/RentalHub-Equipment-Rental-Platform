# RentalHub API Contract — Phase 1

Base path: `/api/v1`

All successful responses return the generated resource shape directly so the React Query client can consume typed data. Errors use `{ "error": "message" }`. Auth is cookie-based and requests must include credentials.

## Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Public |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |

## Marketplace

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/categories` | Public |
| GET | `/equipment` | Public; `q`, `category`, `minPrice`, `maxPrice`, `city`, `sort`, `page`, `limit`, `status` |
| GET | `/equipment/:equipmentId` | Public |
| GET | `/equipment/compare?ids=a,b,c` | Public; maximum three |
| POST/PATCH/DELETE | `/equipment`, `/equipment/:equipmentId` | Owner/Admin; owner ownership enforced |
| GET/POST | `/wishlist` | Authenticated |
| DELETE | `/wishlist/:equipmentId` | Authenticated |

## Owner operations

| Method | Endpoint | Access |
| --- | --- | --- |
| GET/POST | `/maintenance` | Owner/Admin |
| DELETE | `/maintenance/:maintenanceId` | Owner/Admin |
| POST | `/uploads` | Authenticated multipart image upload |

## Admin operations

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/admin/users` | Admin |
| PATCH | `/admin/users/:userId` | Admin |
| GET/PATCH/DELETE | `/categories` | Admin mutations |
| GET | `/admin/overview` | Admin |
| GET | `/admin/audit` | Admin |

The OpenAPI source of truth is `lib/api-spec/openapi.yaml`. Regenerate hooks with `pnpm --filter @workspace/api-spec run codegen`.