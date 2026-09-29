# MongoDB aggregation recipes

These pipelines are documented for MongoDB Compass and will become owner analytics endpoints in the later marketplace phase.

## Active inventory by city

```javascript
db.equipment.aggregate([
  { $match: { status: "active", deletedAt: null } },
  { $group: { _id: "$location.city", listings: { $sum: 1 }, averageDailyPrice: { $avg: "$baseDailyPrice" } } },
  { $sort: { listings: -1 } }
])
```

## Category inventory and average rating

```javascript
db.equipment.aggregate([
  { $match: { status: "active", deletedAt: null } },
  { $group: { _id: "$categoryId", listings: { $sum: 1 }, averageRating: { $avg: "$rating" }, averageDailyPrice: { $avg: "$baseDailyPrice" } } },
  { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
  { $unwind: "$category" },
  { $sort: { listings: -1 } }
])
```

## Maintenance load by owner

```javascript
db.maintenancelogs.aggregate([
  { $match: { status: "scheduled", deletedAt: null } },
  { $group: { _id: "$ownerId", scheduledWindows: { $sum: 1 }, nextWindow: { $min: "$startDate" } } },
  { $sort: { nextWindow: 1 } }
])
```