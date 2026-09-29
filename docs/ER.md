# RentalHub Phase 1 entity notes

```text
User 1──* Equipment
User 1──* Wishlist ──* Equipment
Category 1──* Equipment
Equipment 1──* MaintenanceLog
Equipment 1──* Review
User 1──* Notification
User 1──* AuditLog
```

## Indexes

- `users.email`, `users.role`, `users.status`
- `categories.slug`
- `equipment.title + description` text index
- `equipment.categoryId + status + baseDailyPrice`
- `equipment.ownerId`, `equipment.status`, `equipment.location` 2dsphere
- unique `wishlists.userId + equipmentId`
- `maintenanceLogs.equipmentId + ownerId`

All persisted entities use timestamps and soft-delete fields where deletion is user-visible. Reviews, notifications, and audit logs are schema-ready in Phase 1 and become full vertical slices in later phases.