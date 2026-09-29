import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: String },
  { _id: false },
);

export const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "owner", "admin"], required: true, index: true },
    accountType: { type: String, enum: ["individual", "business"], default: "individual" },
    businessName: String,
    registrationNumber: String,
    avatarUrl: String,
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active", index: true },
    deletedAt: Date,
  },
  { timestamps: true },
);

export const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    deletedAt: Date,
  },
  { timestamps: true },
);

export const equipmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, text: true },
    description: { type: String, required: true, text: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    specs: { type: Map, of: String, default: {} },
    images: { type: [imageSchema], default: [] },
    baseDailyPrice: { type: Number, required: true, index: true },
    baseHourlyPrice: { type: Number, required: true },
    pricingRules: {
      weekendSurcharge: { type: Number, default: 0 },
      longDurationDiscount: { type: Number, default: 0 },
      seasonalOverride: { type: Number, default: 0 },
    },
    baseDeposit: { type: Number, required: true },
    replacementValue: { type: Number, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      city: { type: String, required: true },
      region: { type: String, required: true },
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: ["draft", "active", "paused"], default: "draft", index: true },
    bufferTimeHours: { type: Number, default: 2 },
    purchaseDate: Date,
    conditionNotes: String,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    deletedAt: Date,
  },
  { timestamps: true },
);
equipmentSchema.index({ location: "2dsphere" });
equipmentSchema.index({ categoryId: 1, status: 1, baseDailyPrice: 1 });

export const wishlistSchema = new mongoose.Schema(
  { userId: mongoose.Schema.Types.ObjectId, equipmentId: mongoose.Schema.Types.ObjectId },
  { timestamps: true },
);
wishlistSchema.index({ userId: 1, equipmentId: 1 }, { unique: true });

export const maintenanceLogSchema = new mongoose.Schema(
  {
    equipmentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    notes: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
    deletedAt: Date,
  },
  { timestamps: true },
);

export const reviewSchema = new mongoose.Schema(
  { equipmentId: mongoose.Schema.Types.ObjectId, authorId: mongoose.Schema.Types.ObjectId, rating: Number, comment: String },
  { timestamps: true },
);

export const notificationSchema = new mongoose.Schema(
  { userId: mongoose.Schema.Types.ObjectId, type: String, title: String, body: String, readAt: Date },
  { timestamps: true },
);

export const auditLogSchema = new mongoose.Schema(
  { actorId: mongoose.Schema.Types.ObjectId, action: String, entityType: String, entityId: String, metadata: mongoose.Schema.Types.Mixed },
  { timestamps: true },
);