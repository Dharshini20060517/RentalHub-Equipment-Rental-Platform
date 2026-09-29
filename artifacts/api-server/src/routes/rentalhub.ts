import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  auditLogs, categories, equipment, maintenance, publicEquipment, publicUser, seedStore, users, wishlists,
  type EquipmentRecord, type UserRecord,
} from "../services/store";
import { getUserFromRequest, issueToken, requireAuth, requireRole, setAuthCookies, accessCookie, refreshCookie } from "../middleware/auth";
import { badRequest, notFound, parseLimit, parseNumber, parsePage } from "../utils/response";

const router = Router();
const upload = multer({ dest: "uploads/", limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) });
const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(["customer", "owner"]).default("customer"), accountType: z.enum(["individual", "business"]).default("individual"), businessName: z.string().optional() });
const equipmentSchema = z.object({ title: z.string().min(3), description: z.string().min(10), categoryId: z.string(), specs: z.record(z.string()).default({}), images: z.array(z.object({ url: z.string().url(), publicId: z.string().nullable().optional() })).default([]), baseDailyPrice: z.coerce.number().nonnegative(), baseHourlyPrice: z.coerce.number().nonnegative(), pricingRules: z.object({ weekendSurcharge: z.coerce.number().nonnegative().default(0), longDurationDiscount: z.coerce.number().min(0).max(1).default(0), seasonalOverride: z.coerce.number().nonnegative().default(0) }).default({ weekendSurcharge: 0, longDurationDiscount: 0, seasonalOverride: 0 }), baseDeposit: z.coerce.number().nonnegative(), replacementValue: z.coerce.number().nonnegative(), location: z.object({ city: z.string(), region: z.string(), latitude: z.coerce.number().default(0), longitude: z.coerce.number().default(0) }), status: z.enum(["draft", "active", "paused"]).default("draft"), bufferTimeHours: z.coerce.number().int().nonnegative().default(2), purchaseDate: z.string().optional(), conditionNotes: z.string().optional() });

function currentUser(res: Response) { return res.locals.user as UserRecord; }
function createUser(input: z.infer<typeof registerSchema>, passwordHash: string): UserRecord {
  const user: UserRecord = { id: randomUUID(), name: input.name, email: input.email.toLowerCase(), passwordHash, role: input.role, accountType: input.accountType, businessName: input.businessName, status: "active", createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}
function writeAudit(actorId: string, action: string, entityType: string, entityId?: string) { auditLogs.unshift({ id: randomUUID(), actorId, action, entityType, entityId, createdAt: new Date().toISOString() }); }

router.get("/v1/healthz", (_req, res) => res.json({ status: "ok" }));
router.post("/v1/auth/register", async (req, res) => {
  const input = registerSchema.safeParse(req.body);
  if (!input.success) return badRequest(res, input.error.issues[0]?.message ?? "Invalid registration");
  if (users.some((user) => user.email === input.data.email.toLowerCase())) return res.status(409).json({ error: "An account with that email already exists" });
  const user = createUser(input.data, await bcrypt.hash(input.data.password, 12));
  setAuthCookies(res, user);
  return res.status(201).json({ user: publicUser(user) });
});
router.post("/v1/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = users.find((entry) => entry.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.status !== "active") return res.status(401).json({ error: "Email or password is incorrect" });
  setAuthCookies(res, user);
  return res.json({ user: publicUser(user) });
});
router.post("/v1/auth/logout", (_req, res) => { res.clearCookie(accessCookie); res.clearCookie(refreshCookie); return res.json({ message: "Logged out" }); });
router.get("/v1/auth/me", requireAuth, (_req, res) => res.json(publicUser(currentUser(res))));
router.post("/v1/auth/forgot-password", (req, res) => res.json({ message: `If ${String(req.body?.email ?? "that email")} is registered, reset instructions are ready in the development mail log.` }));
router.post("/v1/auth/reset-password", (_req, res) => res.json({ message: "Password reset links are enabled for the Phase 1 email flow." }));

router.get("/v1/categories", (_req, res) => res.json(categories.filter((entry) => !entry.deletedAt)));
router.post("/v1/categories", requireAuth, requireRole("admin"), (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (name.length < 2) return badRequest(res, "Category name is required");
  const item = { id: randomUUID(), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), description: String(req.body?.description ?? ""), equipmentCount: 0 };
  categories.push(item); writeAudit(currentUser(res).id, "created_category", "category", item.id); return res.status(201).json(item);
});
router.patch("/v1/categories/:categoryId", requireAuth, requireRole("admin"), (req, res) => {
  const item = categories.find((entry) => entry.id === req.params.categoryId);
  if (!item) return notFound(res, "Category not found");
  if (req.body?.name) { item.name = String(req.body.name); item.slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  if (req.body?.description !== undefined) item.description = String(req.body.description);
  return res.json(item);
});
router.delete("/v1/categories/:categoryId", requireAuth, requireRole("admin"), (req, res) => { const item = categories.find((entry) => entry.id === req.params.categoryId); if (!item) return notFound(res, "Category not found"); item.deletedAt = new Date().toISOString(); return res.json({ message: "Category archived" }); });

router.get("/v1/equipment", (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase(); const category = String(req.query.category ?? "");
  const city = String(req.query.city ?? "").toLowerCase(); const minPrice = parseNumber(req.query.minPrice, 0); const maxPrice = parseNumber(req.query.maxPrice, Number.MAX_SAFE_INTEGER);
  const status = String(req.query.status ?? "active");
  let rows = equipment.filter((item) => !item.deletedAt && (status === "all" ? true : item.status === status) && item.baseDailyPrice >= minPrice && item.baseDailyPrice <= maxPrice);
  if (q) rows = rows.filter((item) => `${item.title} ${item.description} ${Object.values(item.specs).join(" ")}`.toLowerCase().includes(q));
  if (category) rows = rows.filter((item) => item.categoryId === category || categories.find((entry) => entry.id === item.categoryId)?.slug === category);
  if (city) rows = rows.filter((item) => item.location.city.toLowerCase().includes(city));
  const sort = String(req.query.sort ?? "recommended"); rows.sort((a, b) => sort === "price-asc" ? a.baseDailyPrice - b.baseDailyPrice : sort === "price-desc" ? b.baseDailyPrice - a.baseDailyPrice : sort === "rating" ? b.rating - a.rating : b.rating - a.rating);
  const page = parsePage(req.query.page); const limit = parseLimit(req.query.limit); const total = rows.length; const start = (page - 1) * limit;
  return res.json({ items: rows.slice(start, start + limit).map(publicEquipment), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});
router.get("/v1/equipment/compare", (req, res) => { const ids = String(req.query.ids ?? "").split(",").filter(Boolean).slice(0, 3); return res.json(ids.map((id) => equipment.find((item) => item.id === id)).filter(Boolean).map(publicEquipment)); });
router.get("/v1/equipment/:equipmentId", (req, res) => { const item = equipment.find((entry) => entry.id === req.params.equipmentId && !entry.deletedAt); return item ? res.json(publicEquipment(item)) : notFound(res, "Equipment not found"); });
router.post("/v1/equipment", requireAuth, requireRole("owner", "admin"), (req, res) => {
  const input = equipmentSchema.safeParse(req.body); if (!input.success) return badRequest(res, input.error.issues[0]?.message ?? "Invalid listing");
  if (!categories.some((entry) => entry.id === input.data.categoryId)) return badRequest(res, "Category not found");
  const item: EquipmentRecord = { ...input.data, id: randomUUID(), ownerId: currentUser(res).id, rating: 0, reviewCount: 0, createdAt: new Date().toISOString(), purchaseDate: input.data.purchaseDate ?? null, conditionNotes: input.data.conditionNotes ?? null };
  equipment.unshift(item); writeAudit(currentUser(res).id, "created_equipment", "equipment", item.id); return res.status(201).json(publicEquipment(item));
});
router.patch("/v1/equipment/:equipmentId", requireAuth, requireRole("owner", "admin"), (req, res) => {
  const item = equipment.find((entry) => entry.id === req.params.equipmentId && !entry.deletedAt); if (!item) return notFound(res, "Equipment not found");
  if (currentUser(res).role !== "admin" && item.ownerId !== currentUser(res).id) return res.status(403).json({ error: "You can only edit your own listings" });
  const input = equipmentSchema.partial().safeParse(req.body); if (!input.success) return badRequest(res, input.error.issues[0]?.message ?? "Invalid listing update");
  Object.assign(item, input.data); writeAudit(currentUser(res).id, "updated_equipment", "equipment", item.id); return res.json(publicEquipment(item));
});
router.delete("/v1/equipment/:equipmentId", requireAuth, requireRole("owner", "admin"), (req, res) => {
  const item = equipment.find((entry) => entry.id === req.params.equipmentId && !entry.deletedAt); if (!item) return notFound(res, "Equipment not found");
  if (currentUser(res).role !== "admin" && item.ownerId !== currentUser(res).id) return res.status(403).json({ error: "You can only archive your own listings" });
  item.deletedAt = new Date().toISOString(); item.status = "paused"; writeAudit(currentUser(res).id, "archived_equipment", "equipment", item.id); return res.json({ message: "Listing archived" });
});

router.get("/v1/wishlist", requireAuth, (req, res) => res.json(Array.from(wishlists.get(currentUser(res).id) ?? []).map((id) => equipment.find((item) => item.id === id)).filter(Boolean).map(publicEquipment)));
router.post("/v1/wishlist", requireAuth, (req, res) => { const id = String(req.body?.equipmentId ?? ""); if (!equipment.some((item) => item.id === id)) return notFound(res, "Equipment not found"); const saved = wishlists.get(currentUser(res).id) ?? new Set<string>(); saved.add(id); wishlists.set(currentUser(res).id, saved); return res.status(201).json({ message: "Saved to wishlist" }); });
router.delete("/v1/wishlist/:equipmentId", requireAuth, (req, res) => { wishlists.get(currentUser(res).id)?.delete(String(req.params.equipmentId)); return res.json({ message: "Removed from wishlist" }); });

router.get("/v1/maintenance", requireAuth, requireRole("owner", "admin"), (req, res) => res.json(maintenance.filter((entry) => currentUser(res).role === "admin" || entry.ownerId === currentUser(res).id)));
router.post("/v1/maintenance", requireAuth, requireRole("owner", "admin"), (req, res) => { const item = { id: randomUUID(), equipmentId: String(req.body?.equipmentId ?? ""), ownerId: currentUser(res).id, title: String(req.body?.title ?? ""), notes: String(req.body?.notes ?? ""), startDate: String(req.body?.startDate ?? ""), endDate: String(req.body?.endDate ?? ""), status: "scheduled" as const }; if (!item.equipmentId || !item.title || !item.startDate || !item.endDate) return badRequest(res, "Equipment, title, and dates are required"); maintenance.unshift(item); return res.status(201).json(item); });
router.delete("/v1/maintenance/:maintenanceId", requireAuth, requireRole("owner", "admin"), (req, res) => { const index = maintenance.findIndex((entry) => entry.id === req.params.maintenanceId && (currentUser(res).role === "admin" || entry.ownerId === currentUser(res).id)); if (index < 0) return notFound(res, "Maintenance record not found"); maintenance.splice(index, 1); return res.json({ message: "Maintenance record deleted" }); });

router.get("/v1/admin/users", requireAuth, requireRole("admin"), (_req, res) => res.json(users.map(publicUser)));
router.patch("/v1/admin/users/:userId", requireAuth, requireRole("admin"), (req, res) => { const user = users.find((entry) => entry.id === req.params.userId); if (!user) return notFound(res, "User not found"); const status = z.enum(["active", "suspended", "pending"]).safeParse(req.body?.status); if (!status.success) return badRequest(res, "Invalid status"); user.status = status.data; writeAudit(currentUser(res).id, `set_user_${status.data}`, "user", user.id); return res.json(publicUser(user)); });
router.get("/v1/admin/overview", requireAuth, requireRole("admin"), (_req, res) => res.json({ users: users.length, listings: equipment.filter((item) => !item.deletedAt).length, activeListings: equipment.filter((item) => item.status === "active" && !item.deletedAt).length, categories: categories.filter((entry) => !entry.deletedAt).length, pendingModeration: equipment.filter((item) => item.status === "draft" && !item.deletedAt).length }));
router.get("/v1/admin/audit", requireAuth, requireRole("admin"), (_req, res) => res.json(auditLogs));
router.post("/v1/uploads", requireAuth, upload.array("images", 8), (req, res) => { const files = (req.files as Express.Multer.File[] | undefined) ?? []; return res.status(201).json({ files: files.map((file) => ({ url: `/api/uploads/${file.filename}`, publicId: file.filename })) }); });

export async function initializeRentalHub() { await seedStore(); }
export default router;