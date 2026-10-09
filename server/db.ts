import { and, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import {
  InsertProfile,
  InsertRescueOffer,
  profiles,
  rescueOffers,
  offerRequests,
  handoffs,
  handoffEvents,
  trustReceipts,
  notifications,
  users,
  pickupHubs,
  type InsertUser,
  type Profile,
  type Handoff,
  type User,
  type RescueOffer,
  type Notification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  provider: "postgres" | "in-memory";
  configured: boolean;
  host?: string;
  error?: string;
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      connected: false,
      configured: false,
      provider: "in-memory",
      error: "DATABASE_URL environment variable is not set.",
    };
  }

  try {
    const client = postgres(dbUrl, { prepare: false, timeout: 5 });
    await client`SELECT 1`;
    let host = "configured-database";
    try {
      const parsed = new URL(dbUrl);
      host = parsed.hostname;
    } catch {}
    await client.end();
    return {
      connected: true,
      configured: true,
      provider: "postgres",
      host,
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      provider: "in-memory",
      error: err?.message || "Failed to connect to database host.",
    };
  }
}

let _db: ReturnType<typeof drizzle> | null = null;
let _dbTested = false;

export async function getDb() {
  if (_dbTested) return _db;
  const dbUrl = process.env.DATABASE_URL;

  // Ignore dummy/placeholder database URLs or local unreachable hosts
  if (
    !dbUrl ||
    dbUrl.includes("@host:") ||
    dbUrl.includes("user:password") ||
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1")
  ) {
    console.warn("[Database] No valid external database configured, using in-memory store.");
    _db = null;
    _dbTested = true;
    return null;
  }

  try {
    const client = postgres(dbUrl, { prepare: false });
    const db = drizzle(client);
    // quick health-check to verify real connection
    await db.execute(sql`SELECT 1`);
    _db = db;
    console.log("[Database] Connected successfully to database.");
  } catch (error) {
    console.warn("[Database] Connection failed, using in-memory store fallback:", error);
    _db = null;
  }

  _dbTested = true;
  return _db;
}

// ============================================================================
// In-Memory Fallback Store (Used when DATABASE_URL is not provided or offline)
// ============================================================================

type MemOfferRequest = {
  id: number;
  offerId: number;
  organizationProfileId: number;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MemHandoffEvent = {
  id: number;
  handoffId: number;
  actorProfileId: number | null;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: Date;
};

type MemTrustReceipt = {
  id: number;
  handoffId: number;
  receiptCode: string;
  outcome: string;
  note: string | null;
  createdAt: Date;
};

type MemPickupHub = {
  id: number;
  name: string;
  address: string;
  contactName: string | null;
  contactPhone: string | null;
  active: number;
  createdAt: Date;
};

const now = new Date();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600 * 1000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);

let nextUserId = 5;
let nextProfileId = 5;
let nextOfferId = 4;
let nextRequestId = 1;
let nextHandoffId = 2;
let nextEventId = 2;
let nextReceiptId = 2;
let nextNotificationId = 1;

const memUsers: User[] = [
  {
    id: 1,
    openId: "demo-user-donor",
    name: "Artisan Bakery & Cafe",
    email: "bakery@foodshare.local",
    loginMethod: "demo",
    role: "user",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
    lastSignedIn: now,
  },
  {
    id: 2,
    openId: "demo-user-organization",
    name: "Hope Community Kitchen",
    email: "hope@foodshare.local",
    loginMethod: "demo",
    role: "user",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
    lastSignedIn: now,
  },
  {
    id: 3,
    openId: "demo-user-volunteer",
    name: "Alex Rivera",
    email: "alex@foodshare.local",
    loginMethod: "demo",
    role: "user",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
    lastSignedIn: now,
  },
  {
    id: 4,
    openId: "demo-user-admin",
    name: "FoodShare Admin",
    email: "admin@foodshare.local",
    loginMethod: "demo",
    role: "admin",
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(72),
    lastSignedIn: now,
  },
];

const memProfiles: Profile[] = [
  {
    id: 1,
    userId: 1,
    role: "donor",
    displayName: "Artisan Bakery & Cafe",
    phone: "555-0199",
    serviceArea: "Downtown District",
    capacity: 100,
    availability: "Daily 8am - 8pm",
    transportMode: null,
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
  },
  {
    id: 2,
    userId: 2,
    role: "organization",
    displayName: "Hope Community Kitchen",
    phone: "555-0210",
    serviceArea: "Central & Eastside",
    capacity: 250,
    availability: "Weekdays 9am - 7pm",
    transportMode: "Van",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
  },
  {
    id: 3,
    userId: 3,
    role: "volunteer",
    displayName: "Alex Rivera",
    phone: "555-0344",
    serviceArea: "Central Metro",
    capacity: 30,
    availability: "Evenings & Weekends",
    transportMode: "Bicycle / Cargo",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
  },
];

const memHubs: MemPickupHub[] = [
  {
    id: 1,
    name: "Downtown Community Hub",
    address: "100 Main Street, Suite 4",
    contactName: "Sarah Jenkins",
    contactPhone: "555-0101",
    active: 1,
    createdAt: hoursAgo(100),
  },
  {
    id: 2,
    name: "Eastside Neighborhood Pantry",
    address: "450 Oak Avenue",
    contactName: "Marcus Chen",
    contactPhone: "555-0102",
    active: 1,
    createdAt: hoursAgo(100),
  },
  {
    id: 3,
    name: "West Green Food Hub",
    address: "720 Elm Boulevard",
    contactName: "Aisha Patel",
    contactPhone: "555-0103",
    active: 1,
    createdAt: hoursAgo(100),
  },
];

const memOffers: RescueOffer[] = [
  {
    id: 1,
    donorProfileId: 1,
    foodName: "Warm Sourdough Bread & Artisan Pastries",
    category: "Bakery",
    quantity: 24,
    quantityUnit: "loaves/items",
    servings: 35,
    condition: "fresh",
    preparedAt: hoursAgo(3),
    readyAt: hoursAgo(1),
    bestBeforeAt: hoursFromNow(5),
    storageMethod: "Room temperature in clean bakery crates",
    allergens: "Gluten, dairy",
    servingNotes: "Freshly baked this morning, perfect for lunch or dinner service",
    pickupAddress: "128 Baker Street, Downtown",
    pickupHubId: 1,
    pickupInstructions: "Side delivery entrance, ring bell for bakery team",
    imagePath: null,
    status: "available",
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
  },
  {
    id: 2,
    donorProfileId: 1,
    foodName: "Fresh Mixed Vegetable Soup & Salad Boxes",
    category: "Prepared Meals",
    quantity: 18,
    quantityUnit: "containers",
    servings: 25,
    condition: "good",
    preparedAt: hoursAgo(4),
    readyAt: hoursAgo(2),
    bestBeforeAt: hoursFromNow(6),
    storageMethod: "Refrigerated at 4°C",
    allergens: "None (Vegan)",
    servingNotes: "Individually packed, wholesome vegetable stew and fresh greens",
    pickupAddress: "340 Market Way, Central Plaza",
    pickupHubId: 2,
    pickupInstructions: "Dispatch counter at the rear alley",
    imagePath: null,
    status: "available",
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
  },
  {
    id: 3,
    donorProfileId: 1,
    foodName: "Fresh Fruit Crates (Apples & Oranges)",
    category: "Produce",
    quantity: 15,
    quantityUnit: "crates",
    servings: 60,
    condition: "fresh",
    preparedAt: hoursAgo(24),
    readyAt: hoursAgo(22),
    bestBeforeAt: hoursAgo(2),
    storageMethod: "Cool storage",
    allergens: null,
    servingNotes: "Distributed successfully to local family shelter",
    pickupAddress: "500 Harbor Boulevard",
    pickupHubId: 3,
    pickupInstructions: "Main loading dock",
    imagePath: null,
    status: "completed",
    createdAt: hoursAgo(24),
    updatedAt: hoursAgo(4),
  },
];

const memOfferRequests: MemOfferRequest[] = [];
const memHandoffs: Handoff[] = [
  {
    id: 1,
    offerId: 3,
    organizationProfileId: 2,
    volunteerProfileId: 3,
    collectionMode: "volunteer",
    status: "completed",
    assignedAt: hoursAgo(20),
    pickedUpAt: hoursAgo(6),
    deliveredAt: hoursAgo(4),
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(4),
  },
];
const memHandoffEvents: MemHandoffEvent[] = [];
const memTrustReceipts: MemTrustReceipt[] = [
  {
    id: 1,
    handoffId: 1,
    receiptCode: "ML-00003-TR001",
    outcome: "Food delivered and confirmed",
    note: "All 60 servings successfully reached community kitchen",
    createdAt: hoursAgo(4),
  },
];
const memNotifications: Notification[] = [];

// ============================================================================
// Database Operations (DB first with try/catch, in-memory fallback)
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  try {
    const db = await getDb();
    if (db) {
      const values: InsertUser = { openId: user.openId };
      const updateSet: Record<string, unknown> = {};
      const textFields = ["name", "email", "loginMethod"] as const;
      for (const field of textFields) {
        const value = user[field];
        if (value !== undefined) {
          values[field] = value ?? null;
          updateSet[field] = value ?? null;
        }
      }
      values.lastSignedIn = user.lastSignedIn ?? new Date();
      updateSet.lastSignedIn = values.lastSignedIn;
      if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = "admin";
        updateSet.role = "admin";
      }
      await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
      return;
    }
  } catch (error) {
    console.warn("[Database] upsertUser failed on DB, using memory:", error);
    _db = null;
  }

  // In-memory fallback
  const existing = memUsers.find(u => u.openId === user.openId);
  const nowTime = new Date();
  if (existing) {
    if (user.name !== undefined) existing.name = user.name ?? null;
    if (user.email !== undefined) existing.email = user.email ?? null;
    if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod ?? null;
    if (user.role !== undefined) existing.role = user.role;
    existing.lastSignedIn = user.lastSignedIn ?? nowTime;
    existing.updatedAt = nowTime;
  } else {
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
    memUsers.push({
      id: nextUserId++,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? "local",
      role,
      createdAt: nowTime,
      updatedAt: nowTime,
      lastSignedIn: user.lastSignedIn ?? nowTime,
    });
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getUserByOpenId failed on DB, using memory:", error);
    _db = null;
  }
  return memUsers.find(u => u.openId === openId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getUserByEmail failed on DB, using memory:", error);
    _db = null;
  }
  return memUsers.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
}

export async function getUserByName(name: string): Promise<User | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.select().from(users).where(eq(users.name, name.trim())).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getUserByName failed on DB, using memory:", error);
    _db = null;
  }
  return memUsers.find(u => u.name?.toLowerCase() === name.trim().toLowerCase());
}

export async function updateUserName(userId: number, newName: string): Promise<void> {
  const cleanName = newName.trim();
  try {
    const db = await getDb();
    if (db) {
      await db.update(users).set({ name: cleanName, updatedAt: new Date() }).where(eq(users.id, userId));
      return;
    }
  } catch (error) {
    console.warn("[Database] updateUserName failed on DB, using memory:", error);
    _db = null;
  }
  const u = memUsers.find(user => user.id === userId);
  if (u) {
    u.name = cleanName;
    u.updatedAt = new Date();
  }
}

export async function updateProfileDisplayName(userId: number, displayName: string): Promise<void> {
  const cleanName = displayName.trim();
  try {
    const db = await getDb();
    if (db) {
      await db.update(profiles).set({ displayName: cleanName, updatedAt: new Date() }).where(eq(profiles.userId, userId));
      return;
    }
  } catch (error) {
    console.warn("[Database] updateProfileDisplayName failed on DB, using memory:", error);
    _db = null;
  }
  memProfiles.forEach(p => {
    if (p.userId === userId) {
      p.displayName = cleanName;
      p.updatedAt = new Date();
    }
  });
}

export async function updateProfileFull(
  userId: number,
  details: {
    displayName: string;
    phone?: string | null;
    serviceArea?: string | null;
    capacity?: number | null;
    availability?: string | null;
    transportMode?: string | null;
  }
): Promise<void> {
  const cleanName = details.displayName.trim();
  try {
    const db = await getDb();
    if (db) {
      await db.update(profiles).set({
        displayName: cleanName,
        phone: details.phone !== undefined ? details.phone : null,
        serviceArea: details.serviceArea !== undefined ? details.serviceArea : null,
        capacity: details.capacity !== undefined ? details.capacity : null,
        availability: details.availability !== undefined ? details.availability : null,
        transportMode: details.transportMode !== undefined ? details.transportMode : null,
        updatedAt: new Date(),
      }).where(eq(profiles.userId, userId));
      return;
    }
  } catch (error) {
    console.warn("[Database] updateProfileFull failed on DB, using memory:", error);
    _db = null;
  }
  memProfiles.forEach(p => {
    if (p.userId === userId) {
      p.displayName = cleanName;
      if (details.phone !== undefined) p.phone = details.phone ?? null;
      if (details.serviceArea !== undefined) p.serviceArea = details.serviceArea ?? null;
      if (details.capacity !== undefined) p.capacity = details.capacity ?? null;
      if (details.availability !== undefined) p.availability = details.availability ?? null;
      if (details.transportMode !== undefined) p.transportMode = details.transportMode ?? null;
      p.updatedAt = new Date();
    }
  });
}

export async function setActiveRoleForUser(userId: number, role: Profile["role"]): Promise<Profile> {
  try {
    const db = await getDb();
    if (db) {
      const existing = await db.select().from(profiles).where(and(eq(profiles.userId, userId), eq(profiles.role, role))).limit(1);
      if (existing.length > 0) {
        await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, existing[0].id));
        return { ...existing[0], updatedAt: new Date() };
      }
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const displayName = user[0]?.name || "FoodShare Member";
      const newProfiles = await db.insert(profiles).values({
        userId,
        role,
        displayName,
      }).returning();
      return newProfiles[0];
    }
  } catch (error) {
    console.warn("[Database] setActiveRoleForUser failed on DB, using memory:", error);
    _db = null;
  }

  // In memory fallback
  const existing = memProfiles.find(p => p.userId === userId && p.role === role);
  if (existing) {
    existing.updatedAt = new Date();
    return existing;
  }
  const u = memUsers.find(user => user.id === userId);
  const displayName = u?.name || "FoodShare Member";
  const newProfile: Profile = {
    id: nextProfileId++,
    userId,
    role,
    displayName,
    phone: null,
    serviceArea: null,
    capacity: null,
    availability: null,
    transportMode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memProfiles.push(newProfile);
  return newProfile;
}

export async function getProfileForUser(userId: number, role?: Profile["role"]): Promise<Profile | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const conditions = role ? and(eq(profiles.userId, userId), eq(profiles.role, role)) : eq(profiles.userId, userId);
      const result = await db.select().from(profiles).where(conditions).orderBy(desc(profiles.updatedAt)).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getProfileForUser failed on DB, using memory:", error);
    _db = null;
  }
  const matching = memProfiles.filter(p => p.userId === userId && (!role || p.role === role));
  if (matching.length === 0) return undefined;
  return matching.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

export async function createProfile(profile: InsertProfile): Promise<number> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.insert(profiles).values(profile).returning({ id: profiles.id });
      return result[0]?.id as number;
    }
  } catch (error) {
    console.warn("[Database] createProfile failed on DB, using memory:", error);
    _db = null;
  }

  // Check if profile exists for this user and role
  const existing = memProfiles.find(p => p.userId === profile.userId && p.role === profile.role);
  if (existing) {
    existing.displayName = profile.displayName;
    if (profile.phone !== undefined) existing.phone = profile.phone ?? null;
    if (profile.serviceArea !== undefined) existing.serviceArea = profile.serviceArea ?? null;
    if (profile.capacity !== undefined) existing.capacity = profile.capacity ?? null;
    if (profile.availability !== undefined) existing.availability = profile.availability ?? null;
    if (profile.transportMode !== undefined) existing.transportMode = profile.transportMode ?? null;
    existing.updatedAt = new Date();
    return existing.id;
  }

  const id = nextProfileId++;
  const newProfile: Profile = {
    id,
    userId: profile.userId,
    role: profile.role,
    displayName: profile.displayName,
    phone: profile.phone ?? null,
    serviceArea: profile.serviceArea ?? null,
    capacity: profile.capacity ?? null,
    availability: profile.availability ?? null,
    transportMode: profile.transportMode ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memProfiles.push(newProfile);
  return id;
}

export async function listProfilesByRole(role: Profile["role"]): Promise<Profile[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db.select().from(profiles).where(eq(profiles.role, role));
    }
  } catch (error) {
    console.warn("[Database] listProfilesByRole failed on DB, using memory:", error);
    _db = null;
  }
  return memProfiles.filter(p => p.role === role);
}

export async function createRescueOffer(offer: InsertRescueOffer): Promise<number> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.insert(rescueOffers).values(offer).returning({ id: rescueOffers.id });
      return result[0]?.id as number;
    }
  } catch (error) {
    console.warn("[Database] createRescueOffer failed on DB, using memory:", error);
    _db = null;
  }

  const id = nextOfferId++;
  const newOffer: RescueOffer = {
    id,
    donorProfileId: offer.donorProfileId,
    foodName: offer.foodName,
    category: offer.category,
    quantity: offer.quantity,
    quantityUnit: offer.quantityUnit,
    servings: offer.servings,
    condition: offer.condition,
    preparedAt: new Date(offer.preparedAt),
    readyAt: new Date(offer.readyAt),
    bestBeforeAt: new Date(offer.bestBeforeAt),
    storageMethod: offer.storageMethod ?? null,
    allergens: offer.allergens ?? null,
    servingNotes: offer.servingNotes ?? null,
    pickupAddress: offer.pickupAddress,
    pickupHubId: offer.pickupHubId ?? null,
    pickupInstructions: offer.pickupInstructions ?? null,
    imagePath: offer.imagePath ?? null,
    status: offer.status ?? "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memOffers.push(newOffer);
  return id;
}

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function addNotification(
  db: Database | null,
  recipientProfileId: number,
  values: { offerId?: number; handoffId?: number; type: string; title: string; body: string }
) {
  if (db) {
    try {
      await db.insert(notifications).values({ recipientProfileId, ...values });
      return;
    } catch {
      _db = null;
    }
  }
  memNotifications.push({
    id: nextNotificationId++,
    recipientProfileId,
    offerId: values.offerId ?? null,
    handoffId: values.handoffId ?? null,
    type: values.type,
    title: values.title,
    body: values.body,
    readAt: null,
    createdAt: new Date(),
  });
}

export async function listOffersForDonor(donorProfileId: number): Promise<RescueOffer[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db
        .select()
        .from(rescueOffers)
        .where(eq(rescueOffers.donorProfileId, donorProfileId))
        .orderBy(desc(rescueOffers.createdAt));
    }
  } catch (error) {
    console.warn("[Database] listOffersForDonor failed on DB, using memory:", error);
    _db = null;
  }
  return memOffers
    .filter(o => o.donorProfileId === donorProfileId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAvailableOffers(): Promise<RescueOffer[]> {
  try {
    const db = await getDb();
    if (db) {
      const curNow = new Date();
      return await db
        .select()
        .from(rescueOffers)
        .where(and(eq(rescueOffers.status, "available"), gt(rescueOffers.bestBeforeAt, curNow)))
        .orderBy(rescueOffers.bestBeforeAt);
    }
  } catch (error) {
    console.warn("[Database] listAvailableOffers failed on DB, using memory:", error);
    _db = null;
  }
  const curNow = new Date();
  return memOffers
    .filter(o => o.status === "available" && o.bestBeforeAt.getTime() > curNow.getTime())
    .sort((a, b) => a.bestBeforeAt.getTime() - b.bestBeforeAt.getTime());
}

export async function getRescueOffer(id: number): Promise<RescueOffer | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.select().from(rescueOffers).where(eq(rescueOffers.id, id)).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getRescueOffer failed on DB, using memory:", error);
    _db = null;
  }
  return memOffers.find(o => o.id === id);
}

export async function requestOffer(offerId: number, organizationProfileId: number, note?: string): Promise<number> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db
        .insert(offerRequests)
        .values({ offerId, organizationProfileId, note, status: "pending" })
        .returning({ id: offerRequests.id });
      await db
        .update(rescueOffers)
        .set({ status: "requested", updatedAt: new Date() })
        .where(eq(rescueOffers.id, offerId));
      const offer = await getRescueOffer(offerId);
      if (offer) {
        await addNotification(db, offer.donorProfileId, {
          offerId,
          type: "offer_requested",
          title: "Someone is interested in your offer",
          body: "A receiving organization has requested this food. Review the next handoff step when you are ready.",
        });
      }
      return result[0]?.id as number;
    }
  } catch (error) {
    console.warn("[Database] requestOffer failed on DB, using memory:", error);
    _db = null;
  }

  // In-memory
  const id = nextRequestId++;
  memOfferRequests.push({
    id,
    offerId,
    organizationProfileId,
    note: note ?? null,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const offer = memOffers.find(o => o.id === offerId);
  if (offer) {
    offer.status = "requested";
    offer.updatedAt = new Date();
    await addNotification(null, offer.donorProfileId, {
      offerId,
      type: "offer_requested",
      title: "Someone is interested in your offer",
      body: "A receiving organization has requested this food. Review the next handoff step when you are ready.",
    });
  }
  return id;
}

export async function acceptOffer(
  offerId: number,
  organizationProfileId: number,
  collectionMode: "self" | "volunteer"
): Promise<number> {
  try {
    const db = await getDb();
    if (db) {
      const existing = await db
        .select()
        .from(offerRequests)
        .where(
          and(eq(offerRequests.offerId, offerId), eq(offerRequests.organizationProfileId, organizationProfileId))
        )
        .limit(1);
      if (existing[0]) {
        await db.update(offerRequests).set({ status: "accepted", updatedAt: new Date() }).where(eq(offerRequests.id, existing[0].id));
      } else {
        await db.insert(offerRequests).values({ offerId, organizationProfileId, status: "accepted" });
      }
      const handoff = await db
        .insert(handoffs)
        .values({
          offerId,
          organizationProfileId,
          collectionMode,
          status: "accepted",
          assignedAt: collectionMode === "self" ? new Date() : null,
        })
        .returning({ id: handoffs.id });
      await db.update(rescueOffers).set({ status: "accepted", updatedAt: new Date() }).where(eq(rescueOffers.id, offerId));
      const offer = await getRescueOffer(offerId);
      if (offer) {
        await addNotification(db, offer.donorProfileId, {
          offerId,
          type: "offer_accepted",
          title: "Your food offer has been accepted",
          body:
            collectionMode === "self"
              ? "The receiving organization will collect this offer directly."
              : "A handoff is being arranged for your food.",
        });
      }
      return handoff[0]?.id as number;
    }
  } catch (error) {
    console.warn("[Database] acceptOffer failed on DB, using memory:", error);
    _db = null;
  }

  // In-memory
  const req = memOfferRequests.find(r => r.offerId === offerId && r.organizationProfileId === organizationProfileId);
  if (req) {
    req.status = "accepted";
    req.updatedAt = new Date();
  } else {
    memOfferRequests.push({
      id: nextRequestId++,
      offerId,
      organizationProfileId,
      status: "accepted",
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const handoffId = nextHandoffId++;
  const newHandoff: Handoff = {
    id: handoffId,
    offerId,
    organizationProfileId,
    volunteerProfileId: null,
    collectionMode,
    status: "accepted",
    assignedAt: collectionMode === "self" ? new Date() : null,
    pickedUpAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memHandoffs.push(newHandoff);

  const offer = memOffers.find(o => o.id === offerId);
  if (offer) {
    offer.status = "accepted";
    offer.updatedAt = new Date();
    await addNotification(null, offer.donorProfileId, {
      offerId,
      type: "offer_accepted",
      title: "Your food offer has been accepted",
      body:
        collectionMode === "self"
          ? "The receiving organization will collect this offer directly."
          : "A handoff is being arranged for your food.",
    });
  }
  return handoffId;
}

export async function getHandoff(id: number): Promise<Handoff | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.select().from(handoffs).where(eq(handoffs.id, id)).limit(1);
      return result[0];
    }
  } catch (error) {
    console.warn("[Database] getHandoff failed on DB, using memory:", error);
    _db = null;
  }
  return memHandoffs.find(h => h.id === id);
}

export async function advanceHandoff(
  id: number,
  nextStatus: Handoff["status"],
  actorProfileId?: number,
  note?: string
): Promise<Handoff | undefined> {
  try {
    const db = await getDb();
    if (db) {
      const current = await getHandoff(id);
      if (!current) throw new Error("Handoff not found");
      const timestamps: Record<string, Date> = {};
      if (nextStatus === "picked_up") timestamps.pickedUpAt = new Date();
      if (nextStatus === "delivered" || nextStatus === "completed") timestamps.deliveredAt = new Date();
      await db.update(handoffs).set({ status: nextStatus, updatedAt: new Date(), ...timestamps }).where(eq(handoffs.id, id));
      await db.update(rescueOffers).set({ status: nextStatus, updatedAt: new Date() }).where(eq(rescueOffers.id, current.offerId));
      await db.insert(handoffEvents).values({ handoffId: id, actorProfileId, fromStatus: current.status, toStatus: nextStatus, note });
      const offer = await getRescueOffer(current.offerId);
      if (offer) {
        const recipients = new Set(
          [offer.donorProfileId, current.organizationProfileId, current.volunteerProfileId].filter(
            (value): value is number => Boolean(value)
          )
        );
        const body =
          nextStatus === "completed"
            ? "This handoff is complete. A Trust Receipt is ready."
            : `Handoff update: ${nextStatus.replaceAll("_", " ")}.`;
        for (const recipientProfileId of recipients) {
          await addNotification(db, recipientProfileId, {
            offerId: current.offerId,
            handoffId: id,
            type: `handoff_${nextStatus}`,
            title: nextStatus === "completed" ? "Trust Receipt created" : "Handoff updated",
            body,
          });
        }
      }
      if (nextStatus === "completed") {
        const code = `ML-${String(current.offerId).padStart(5, "0")}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
        await db.insert(trustReceipts).values({ handoffId: id, receiptCode: code, outcome: "Food delivered and confirmed", note });
      }
      return getHandoff(id);
    }
  } catch (error) {
    console.warn("[Database] advanceHandoff failed on DB, using memory:", error);
    _db = null;
  }

  // In-memory
  const current = memHandoffs.find(h => h.id === id);
  if (!current) throw new Error("Handoff not found");
  const oldStatus = current.status;
  current.status = nextStatus;
  current.updatedAt = new Date();
  if (nextStatus === "picked_up") current.pickedUpAt = new Date();
  if (nextStatus === "delivered" || nextStatus === "completed") current.deliveredAt = new Date();

  const offer = memOffers.find(o => o.id === current.offerId);
  if (offer) {
    offer.status = nextStatus;
    offer.updatedAt = new Date();
  }

  memHandoffEvents.push({
    id: nextEventId++,
    handoffId: id,
    actorProfileId: actorProfileId ?? null,
    fromStatus: oldStatus,
    toStatus: nextStatus,
    note: note ?? null,
    createdAt: new Date(),
  });

  if (offer) {
    const recipients = new Set(
      [offer.donorProfileId, current.organizationProfileId, current.volunteerProfileId].filter(
        (value): value is number => Boolean(value)
      )
    );
    const body =
      nextStatus === "completed"
        ? "This handoff is complete. A Trust Receipt is ready."
        : `Handoff update: ${nextStatus.replaceAll("_", " ")}.`;
    for (const recipientProfileId of recipients) {
      await addNotification(null, recipientProfileId, {
        offerId: current.offerId,
        handoffId: id,
        type: `handoff_${nextStatus}`,
        title: nextStatus === "completed" ? "Trust Receipt created" : "Handoff updated",
        body,
      });
    }
  }

  if (nextStatus === "completed") {
    const code = `ML-${String(current.offerId).padStart(5, "0")}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    memTrustReceipts.push({
      id: nextReceiptId++,
      handoffId: id,
      receiptCode: code,
      outcome: "Food delivered and confirmed",
      note: note ?? null,
      createdAt: new Date(),
    });
  }

  return current;
}

export async function listNotifications(profileId: number): Promise<Notification[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientProfileId, profileId))
        .orderBy(desc(notifications.createdAt))
        .limit(30);
    }
  } catch (error) {
    console.warn("[Database] listNotifications failed on DB, using memory:", error);
    _db = null;
  }
  return memNotifications
    .filter(n => n.recipientProfileId === profileId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);
}

export async function markNotificationRead(profileId: number, id: number): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.recipientProfileId, profileId)));
      return;
    }
  } catch (error) {
    console.warn("[Database] markNotificationRead failed on DB, using memory:", error);
    _db = null;
  }
  const notif = memNotifications.find(n => n.id === id && n.recipientProfileId === profileId);
  if (notif) notif.readAt = new Date();
}

export async function getImpactSummary(): Promise<{ offers: number; completed: number; servings: number }> {
  try {
    const db = await getDb();
    if (db) {
      const all = await db
        .select({ id: rescueOffers.id, servings: rescueOffers.servings, status: rescueOffers.status })
        .from(rescueOffers);
      return {
        offers: all.length,
        completed: all.filter(row => row.status === "completed").length,
        servings: all.filter(row => row.status === "completed").reduce((sum, row) => sum + row.servings, 0),
      };
    }
  } catch (error) {
    console.warn("[Database] getImpactSummary failed on DB, using memory:", error);
    _db = null;
  }
  return {
    offers: memOffers.length,
    completed: memOffers.filter(row => row.status === "completed").length,
    servings: memOffers.filter(row => row.status === "completed").reduce((sum, row) => sum + row.servings, 0),
  };
}

export async function listActiveHubs(): Promise<MemPickupHub[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db.select().from(pickupHubs).where(eq(pickupHubs.active, 1)).orderBy(pickupHubs.name);
    }
  } catch (error) {
    console.warn("[Database] listActiveHubs failed on DB, using memory:", error);
    _db = null;
  }
  return memHubs.filter(h => h.active === 1).sort((a, b) => a.name.localeCompare(b.name));
}
