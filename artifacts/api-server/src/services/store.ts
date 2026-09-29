import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export type Role = "customer" | "owner" | "admin";
export type UserStatus = "active" | "suspended" | "pending";
export type EquipmentStatus = "draft" | "active" | "paused";

export type UserRecord = {
  id: string; name: string; email: string; passwordHash: string; role: Role;
  accountType: "individual" | "business"; businessName?: string; avatarUrl?: string;
  status: UserStatus; createdAt: string; deletedAt?: string;
};
export type CategoryRecord = { id: string; name: string; slug: string; description?: string; equipmentCount?: number; deletedAt?: string };
export type EquipmentRecord = {
  id: string; title: string; description: string; categoryId: string; specs: Record<string, string>;
  images: { url: string; publicId?: string | null }[]; baseDailyPrice: number; baseHourlyPrice: number;
  pricingRules: { weekendSurcharge: number; longDurationDiscount: number; seasonalOverride: number };
  baseDeposit: number; replacementValue: number; location: { city: string; region: string; latitude: number; longitude: number };
  ownerId: string; status: EquipmentStatus; bufferTimeHours: number; purchaseDate?: string | null; deletedAt?: string;
  conditionNotes?: string | null; rating: number; reviewCount: number; createdAt: string;
};
export type MaintenanceRecord = {
  id: string; equipmentId: string; ownerId: string; title: string; notes?: string;
  startDate: string; endDate: string; status: "scheduled" | "completed" | "cancelled";
};

const imageSets = [
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1517148815978-75f6acaaf32c?auto=format&fit=crop&w=1200&q=85",
];
const cityData = [
  ["Austin", "Texas", 30.2672, -97.7431],
  ["Brooklyn", "New York", 40.6782, -73.9442],
  ["Denver", "Colorado", 39.7392, -104.9903],
  ["Portland", "Oregon", 45.5152, -122.6784],
  ["Nashville", "Tennessee", 36.1627, -86.7816],
];
const listingNames = [
  ["Cinema Camera Kit", "Camera & Video", "Sony FX3 cinema body with a 24-70mm lens, cage, batteries, and dual charger.", 145],
  ["Aputure Light Storm", "Lighting", "A powerful daylight LED with softbox and grid for location shoots.", 80],
  ["DJI RS 3 Pro", "Camera & Video", "Carbon-fiber gimbal ready for full-frame camera builds.", 68],
  ["Sprinter Cargo Van", "Vehicles", "Clean, well-maintained cargo van for production crews and event builds.", 195],
  ["DJI Mavic 3 Pro", "Drones", "Triple-camera drone with spare batteries and travel case.", 120],
  ["Podcast Studio Kit", "Audio", "Four-channel recording kit with microphones, stands, and acoustic panels.", 95],
  ["Portable PA System", "Events", "Battery-powered sound system for pop-ups, talks, and small venues.", 75],
  ["E-bike Fleet", "Outdoor", "Comfortable commuter e-bike with lock, helmet, and rear rack.", 55],
  ["Carbon Road Bike", "Outdoor", "Race-ready carbon bike fitted and tuned before every handoff.", 90],
  ["Projector & Screen", "Events", "Bright 4K projector with 100-inch screen and HDMI kit.", 65],
  ["Sewing & Craft Table", "Tools", "Heavy-duty craft station with cutting mat, storage, and task light.", 42],
  ["Stage Deck Set", "Events", "Modular 4x4 stage decks with adjustable legs and cart.", 110],
];

export const users: UserRecord[] = [];
export const categories: CategoryRecord[] = [];
export const equipment: EquipmentRecord[] = [];
export const wishlists = new Map<string, Set<string>>();
export const maintenance: MaintenanceRecord[] = [];
export const auditLogs: { id: string; actorId: string; action: string; entityType: string; entityId?: string; createdAt: string }[] = [];

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function makeUser(data: Omit<UserRecord, "id" | "createdAt">) {
  const user = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}

export async function seedStore() {
  if (users.length) return;
  const hash = await bcrypt.hash("RentalHub123!", 10);
  const admin = makeUser({ name: "RentalHub Admin", email: "admin@rentalhub.local", passwordHash: hash, role: "admin", accountType: "business", businessName: "RentalHub", status: "active" });
  const owner = makeUser({ name: "Maya Chen", email: "maya@rentalhub.local", passwordHash: hash, role: "owner", accountType: "business", businessName: "Frame & Field Co.", status: "active" });
  makeUser({ name: "Jordan Brooks", email: "jordan@rentalhub.local", passwordHash: hash, role: "customer", accountType: "individual", status: "active" });
  const categoryNames = ["Camera & Video", "Lighting", "Audio", "Drones", "Vehicles", "Events", "Outdoor", "Tools", "Workspace"];
  for (const name of categoryNames) categories.push({ id: randomUUID(), name, slug: slugify(name), description: `Rental-ready ${name.toLowerCase()} from trusted local owners.` });
  for (let i = 0; i < 36; i += 1) {
    const source = listingNames[i % listingNames.length];
    const category = categories.find((item) => item.name === source[1]) ?? categories[i % categories.length];
    const city = cityData[i % cityData.length];
    const item: EquipmentRecord = {
      id: randomUUID(), title: i >= listingNames.length ? `${String(source[0])} ${Math.floor(i / listingNames.length) + 1}` : String(source[0]),
      description: String(source[2]), categoryId: category.id, specs: { "Included": i % 2 ? "Case, charger, quick-start guide" : "Checked, cleaned, and ready to use", "Ideal for": i % 3 ? "Independent creators" : "Production teams", "Pickup": "Flexible local pickup" },
      images: [{ url: imageSets[i % imageSets.length], publicId: null }], baseDailyPrice: source[3] as number, baseHourlyPrice: Math.round((source[3] as number) / 8),
      pricingRules: { weekendSurcharge: i % 3 === 0 ? 0.15 : 0, longDurationDiscount: i % 2 === 0 ? 0.1 : 0.05, seasonalOverride: 0 },
      baseDeposit: Math.round((source[3] as number) * 2.5), replacementValue: Math.round((source[3] as number) * 18),
      location: { city: city[0] as string, region: city[1] as string, latitude: city[2] as number, longitude: city[3] as number },
      ownerId: owner.id, status: i % 11 === 0 ? "paused" : "active", bufferTimeHours: 2, purchaseDate: "2023-04-15", conditionNotes: "Professionally checked before every rental.", rating: Number((4.3 + (i % 7) / 10).toFixed(1)), reviewCount: 5 + (i * 3) % 42, createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
    equipment.push(item);
  }
  for (const category of categories) category.equipmentCount = equipment.filter((item) => item.categoryId === category.id).length;
  maintenance.push({ id: randomUUID(), equipmentId: equipment[0].id, ownerId: owner.id, title: "Quarterly sensor clean", notes: "Keep unavailable for bench inspection.", startDate: "2026-10-12", endDate: "2026-10-13", status: "scheduled" });
  auditLogs.push({ id: randomUUID(), actorId: admin.id, action: "seeded_platform", entityType: "system", createdAt: new Date().toISOString() });
}

export function publicUser(user: UserRecord) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
export function publicEquipment(item: EquipmentRecord) {
  const category = categories.find((entry) => entry.id === item.categoryId);
  const owner = users.find((entry) => entry.id === item.ownerId);
  return { ...item, category: category ? { ...category, equipmentCount: category.equipmentCount ?? 0 } : null, owner: owner ? publicUser(owner) : null };
}