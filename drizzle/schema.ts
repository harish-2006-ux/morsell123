import {
  index,
  integer,
  serial,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 64 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    role: varchar("role", { length: 64 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    serviceArea: varchar("serviceArea", { length: 160 }),
    capacity: integer("capacity"),
    availability: varchar("availability", { length: 160 }),
    transportMode: varchar("transportMode", { length: 40 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("profiles_user_role_unique").on(table.userId, table.role), index("profiles_role_idx").on(table.role)]
);

export const pickupHubs = pgTable(
  "pickup_hubs",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    address: text("address").notNull(),
    contactName: varchar("contactName", { length: 160 }),
    contactPhone: varchar("contactPhone", { length: 40 }),
    active: integer("active").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("pickup_hubs_active_idx").on(table.active)]
);

export const rescueOffers = pgTable(
  "rescue_offers",
  {
    id: serial("id").primaryKey(),
    donorProfileId: integer("donorProfileId").notNull().references(() => profiles.id),
    foodName: varchar("foodName", { length: 180 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    quantity: integer("quantity").notNull(),
    quantityUnit: varchar("quantityUnit", { length: 30 }).notNull(),
    servings: integer("servings").notNull(),
    condition: varchar("condition", { length: 64 }).notNull(),
    preparedAt: timestamp("preparedAt").notNull(),
    readyAt: timestamp("readyAt").notNull(),
    bestBeforeAt: timestamp("bestBeforeAt").notNull(),
    storageMethod: varchar("storageMethod", { length: 120 }),
    allergens: text("allergens"),
    servingNotes: text("servingNotes"),
    pickupAddress: text("pickupAddress").notNull(),
    pickupHubId: integer("pickupHubId").references(() => pickupHubs.id),
    pickupInstructions: text("pickupInstructions"),
    imagePath: varchar("imagePath", { length: 500 }),
    status: varchar("status", { length: 64 }).default("available").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("rescue_offers_status_idx").on(table.status), index("rescue_offers_best_before_idx").on(table.bestBeforeAt), index("rescue_offers_donor_idx").on(table.donorProfileId)]
);

export const offerRequests = pgTable(
  "offer_requests",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offerId").notNull().references(() => rescueOffers.id),
    organizationProfileId: integer("organizationProfileId").notNull().references(() => profiles.id),
    status: varchar("status", { length: 64 }).default("pending").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("offer_requests_offer_idx").on(table.offerId), index("offer_requests_org_idx").on(table.organizationProfileId)]
);

export const handoffs = pgTable(
  "handoffs",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offerId").notNull().references(() => rescueOffers.id),
    organizationProfileId: integer("organizationProfileId").notNull().references(() => profiles.id),
    volunteerProfileId: integer("volunteerProfileId").references(() => profiles.id),
    collectionMode: varchar("collectionMode", { length: 64 }).default("volunteer").notNull(),
    status: varchar("status", { length: 64 }).default("accepted").notNull(),
    assignedAt: timestamp("assignedAt"),
    pickedUpAt: timestamp("pickedUpAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("handoffs_offer_unique").on(table.offerId), index("handoffs_status_idx").on(table.status)]
);

export const handoffEvents = pgTable(
  "handoff_events",
  {
    id: serial("id").primaryKey(),
    handoffId: integer("handoffId").notNull().references(() => handoffs.id),
    actorProfileId: integer("actorProfileId").references(() => profiles.id),
    fromStatus: varchar("fromStatus", { length: 40 }),
    toStatus: varchar("toStatus", { length: 40 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("handoff_events_handoff_idx").on(table.handoffId)]
);

export const trustReceipts = pgTable(
  "trust_receipts",
  {
    id: serial("id").primaryKey(),
    handoffId: integer("handoffId").notNull().references(() => handoffs.id),
    receiptCode: varchar("receiptCode", { length: 40 }).notNull().unique(),
    outcome: varchar("outcome", { length: 160 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("trust_receipts_handoff_unique").on(table.handoffId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    recipientProfileId: integer("recipientProfileId").notNull().references(() => profiles.id),
    offerId: integer("offerId").references(() => rescueOffers.id),
    handoffId: integer("handoffId").references(() => handoffs.id),
    type: varchar("type", { length: 60 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_recipient_idx").on(table.recipientProfileId, table.createdAt)]
);

export const reportedIssues = pgTable(
  "reported_issues",
  {
    id: serial("id").primaryKey(),
    handoffId: integer("handoffId").notNull().references(() => handoffs.id),
    reporterProfileId: integer("reporterProfileId").notNull().references(() => profiles.id),
    description: text("description").notNull(),
    status: varchar("status", { length: 64 }).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("reported_issues_status_idx").on(table.status)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type RescueOffer = typeof rescueOffers.$inferSelect;
export type InsertRescueOffer = typeof rescueOffers.$inferInsert;
export type Handoff = typeof handoffs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
