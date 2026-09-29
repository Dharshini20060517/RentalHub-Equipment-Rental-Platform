# Architecture decisions

## Phase 1

1. **Mongo-first model definitions with a memory development adapter.** Mongoose schemas, timestamps, soft-delete fields, text and geo indexes are defined even when local MongoDB is not configured. The in-memory adapter keeps the preview and seed flow usable in a fresh environment without weakening the production model contract.
2. **Direct generated response shapes.** The API returns the resource payload expected by the generated React Query client, with `{ error }` for failures. This avoids duplicated envelope parsing in every page while keeping pagination metadata on list responses.
3. **Cookie JWT auth.** Access and refresh tokens are both httpOnly cookies. This prevents the frontend from needing to persist bearer credentials and leaves the refresh flow ready for the booking phases.
4. **Uploads are adapter-ready.** Local development uses Multer disk storage with validated images; Cloudinary environment variables are reserved for the production adapter. Listing records store URL/publicId pairs, not file bytes.
5. **Booking is intentionally deferred.** Phase 1 only stores maintenance records and owner-blocked data boundaries. The single BookingService and conflict engine begin in Phase 2 so no partial booking behavior can create false availability.