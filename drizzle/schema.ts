import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable(
  "profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    role: mysqlEnum("role", ["donor", "organization", "volunteer"]).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    serviceArea: varchar("serviceArea", { length: 160 }),
    capacity: int("capacity"),
    availability: varchar("availability", { length: 160 }),
    transportMode: varchar("transportMode", { length: 40 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("profiles_user_role_unique").on(table.userId, table.role), index("profiles_role_idx").on(table.role)]
);

export const pickupHubs = mysqlTable(
  "pickup_hubs",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    address: text("address").notNull(),
    contactName: varchar("contactName", { length: 160 }),
    contactPhone: varchar("contactPhone", { length: 40 }),
    active: int("active").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("pickup_hubs_active_idx").on(table.active)]
);

export const rescueOffers = mysqlTable(
  "rescue_offers",
  {
    id: int("id").autoincrement().primaryKey(),
    donorProfileId: int("donorProfileId").notNull().references(() => profiles.id),
    foodName: varchar("foodName", { length: 180 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    quantity: int("quantity").notNull(),
    quantityUnit: varchar("quantityUnit", { length: 30 }).notNull(),
    servings: int("servings").notNull(),
    condition: mysqlEnum("condition", ["fresh", "good", "soon"]).notNull(),
    preparedAt: timestamp("preparedAt").notNull(),
    readyAt: timestamp("readyAt").notNull(),
    bestBeforeAt: timestamp("bestBeforeAt").notNull(),
    storageMethod: varchar("storageMethod", { length: 120 }),
    allergens: text("allergens"),
    servingNotes: text("servingNotes"),
    pickupAddress: text("pickupAddress").notNull(),
    pickupHubId: int("pickupHubId").references(() => pickupHubs.id),
    pickupInstructions: text("pickupInstructions"),
    imagePath: varchar("imagePath", { length: 500 }),
    status: mysqlEnum("status", ["draft", "available", "requested", "accepted", "handoff_arranged", "picked_up", "on_the_way", "delivered", "completed", "expired", "cancelled", "issue_reported"]).default("available").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("rescue_offers_status_idx").on(table.status), index("rescue_offers_best_before_idx").on(table.bestBeforeAt), index("rescue_offers_donor_idx").on(table.donorProfileId)]
);

export const offerRequests = mysqlTable(
  "offer_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    offerId: int("offerId").notNull().references(() => rescueOffers.id),
    organizationProfileId: int("organizationProfileId").notNull().references(() => profiles.id),
    status: mysqlEnum("status", ["pending", "accepted", "declined", "withdrawn"]).default("pending").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("offer_requests_offer_idx").on(table.offerId), index("offer_requests_org_idx").on(table.organizationProfileId)]
);

export const handoffs = mysqlTable(
  "handoffs",
  {
    id: int("id").autoincrement().primaryKey(),
    offerId: int("offerId").notNull().references(() => rescueOffers.id),
    organizationProfileId: int("organizationProfileId").notNull().references(() => profiles.id),
    volunteerProfileId: int("volunteerProfileId").references(() => profiles.id),
    collectionMode: mysqlEnum("collectionMode", ["volunteer", "self"]).default("volunteer").notNull(),
    status: mysqlEnum("status", ["accepted", "handoff_arranged", "picked_up", "on_the_way", "delivered", "completed", "issue_reported"]).default("accepted").notNull(),
    assignedAt: timestamp("assignedAt"),
    pickedUpAt: timestamp("pickedUpAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("handoffs_offer_unique").on(table.offerId), index("handoffs_status_idx").on(table.status)]
);

export const handoffEvents = mysqlTable(
  "handoff_events",
  {
    id: int("id").autoincrement().primaryKey(),
    handoffId: int("handoffId").notNull().references(() => handoffs.id),
    actorProfileId: int("actorProfileId").references(() => profiles.id),
    fromStatus: varchar("fromStatus", { length: 40 }),
    toStatus: varchar("toStatus", { length: 40 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("handoff_events_handoff_idx").on(table.handoffId)]
);

export const trustReceipts = mysqlTable(
  "trust_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    handoffId: int("handoffId").notNull().references(() => handoffs.id),
    receiptCode: varchar("receiptCode", { length: 40 }).notNull().unique(),
    outcome: varchar("outcome", { length: 160 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("trust_receipts_handoff_unique").on(table.handoffId)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    recipientProfileId: int("recipientProfileId").notNull().references(() => profiles.id),
    offerId: int("offerId").references(() => rescueOffers.id),
    handoffId: int("handoffId").references(() => handoffs.id),
    type: varchar("type", { length: 60 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_recipient_idx").on(table.recipientProfileId, table.createdAt)]
);

export const reportedIssues = mysqlTable(
  "reported_issues",
  {
    id: int("id").autoincrement().primaryKey(),
    handoffId: int("handoffId").notNull().references(() => handoffs.id),
    reporterProfileId: int("reporterProfileId").notNull().references(() => profiles.id),
    description: text("description").notNull(),
    status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
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
