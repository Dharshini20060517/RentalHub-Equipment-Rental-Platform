# RentalHub progress

## Current phase

Phase 1 — Foundation & Marketplace. The application is ready for the Phase 1 walkthrough; booking and rental lifecycle work is reserved for Phase 2.

## Feature status

- Authentication and roles: done
- Customer discovery, search, filters, pagination: done
- Equipment detail and compare: done
- Wishlist: done
- Owner listing CRUD and ownership checks: done
- Dynamic pricing v1 fields: done
- Maintenance logs: done
- Admin users, categories, moderation overview, audit records: done
- Multer image upload boundary: done
- MongoDB schemas and indexes: defined; memory adapter used when no URI is configured
- Booking availability engine: Phase 2

## Page inventory

| Route | Role | Status |
| --- | --- | --- |
| `/` | Public | Done |
| `/search` | Public | Done |
| `/equipment/:id` | Public | Done |
| `/compare` | Customer/Public | Done |
| `/wishlist` | Customer | Done |
| `/login`, `/register`, `/reset` | Public | Done |
| `/profile` | Authenticated | Done |
| `/owner/listings`, `/owner/listings/new`, `/owner/listings/:id/edit` | Owner | Done |
| `/owner/maintenance` | Owner | Done |
| `/admin/users`, `/admin/categories`, `/admin/moderation`, `/admin/audit` | Admin | Done |

## Demo accounts

Password for all seeded accounts: `RentalHub123!`.

## Known follow-up

Connect the Mongoose adapter to a replica set or Atlas, add Cloudinary signed uploads, and begin Phase 2 with the single BookingService and date conflict transaction.