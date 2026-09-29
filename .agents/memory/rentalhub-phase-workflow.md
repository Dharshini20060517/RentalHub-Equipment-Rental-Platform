---
name: RentalHub phase workflow
description: Durable phase boundary and development adapter decision for RentalHub.
---

Phase 1 should remain a usable marketplace foundation before Phase 2 introduces booking concurrency and rental state transitions. The app can run with a seeded in-memory adapter when MongoDB is not configured, while keeping Mongoose schemas and indexes as the production persistence contract.

**Why:** The project brief requires phase-by-phase delivery and a fresh preview must work even when an external MongoDB URI is not present.

**How to apply:** Finish and document each phase checkpoint before adding the next phase's cross-cutting lifecycle behavior. Keep booking creation behind one service when Phase 2 begins.