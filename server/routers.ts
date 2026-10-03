import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import {
  acceptOffer,
  advanceHandoff,
  createProfile,
  createRescueOffer,
  getHandoff,
  getImpactSummary,
  getProfileForUser,
  getRescueOffer,
  listActiveHubs,
  listAvailableOffers,
  listNotifications,
  listOffersForDonor,
  markNotificationRead,
  requestOffer,
} from "./db";
import type { Profile, RescueOffer } from "../drizzle/schema";

const roleSchema = z.enum(["donor", "organization", "volunteer"]);
const profileInput = z.object({
  role: roleSchema,
  displayName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional(),
  serviceArea: z.string().trim().max(160).optional(),
  capacity: z.number().int().positive().max(100000).optional(),
  availability: z.string().trim().max(160).optional(),
  transportMode: z.string().trim().max(40).optional(),
});
const offerInput = z.object({
  foodName: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(80),
  quantity: z.number().int().positive().max(100000),
  quantityUnit: z.string().trim().min(1).max(30),
  servings: z.number().int().positive().max(100000),
  condition: z.enum(["fresh", "good", "soon"]),
  preparedAt: z.coerce.date(),
  readyAt: z.coerce.date(),
  bestBeforeAt: z.coerce.date(),
  storageMethod: z.string().trim().max(120).optional(),
  allergens: z.string().trim().max(1000).optional(),
  servingNotes: z.string().trim().max(1000).optional(),
  pickupAddress: z.string().trim().min(5).max(1000),
  pickupHubId: z.number().int().positive().optional(),
  pickupInstructions: z.string().trim().max(1000).optional(),
  imagePath: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.readyAt < value.preparedAt) ctx.addIssue({ code: "custom", path: ["readyAt"], message: "Ready time must be after preparation time." });
  if (value.bestBeforeAt <= value.readyAt) ctx.addIssue({ code: "custom", path: ["bestBeforeAt"], message: "Best-before time must be after ready time." });
});

function requireRole(userId: number, role: Profile["role"]) {
  return getProfileForUser(userId, role).then(profile => {
    if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "Set up this role before continuing." });
    return profile;
  });
}

const allowedTransitions: Record<RescueOffer["status"], RescueOffer["status"][]> = {
  draft: ["available", "cancelled"],
  available: ["requested", "cancelled", "expired"],
  requested: ["accepted", "available", "cancelled", "expired"],
  accepted: ["handoff_arranged", "cancelled", "issue_reported"],
  handoff_arranged: ["picked_up", "issue_reported", "cancelled"],
  picked_up: ["on_the_way", "delivered", "issue_reported"],
  on_the_way: ["delivered", "issue_reported"],
  delivered: ["completed", "issue_reported"],
  completed: [],
  expired: [],
  cancelled: [],
  issue_reported: ["handoff_arranged", "picked_up", "on_the_way", "delivered", "cancelled"],
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  public: router({
    impact: publicProcedure.query(() => getImpactSummary()),
    hubs: publicProcedure.query(() => listActiveHubs()),
    availableOffers: publicProcedure.query(() => listAvailableOffers()),
    offer: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getRescueOffer(input.id)),
  }),
  profile: router({
    mine: protectedProcedure.query(({ ctx }) => getProfileForUser(ctx.user.id)),
    save: protectedProcedure.input(profileInput).mutation(({ ctx, input }) => createProfile({ userId: ctx.user.id, ...input })),
  }),
  donor: router({
    offers: protectedProcedure.query(({ ctx }) => requireRole(ctx.user.id, "donor").then(profile => listOffersForDonor(profile.id))),
    createOffer: protectedProcedure.input(offerInput).mutation(async ({ ctx, input }) => {
      const profile = await requireRole(ctx.user.id, "donor");
      return createRescueOffer({ donorProfileId: profile.id, ...input, status: "available" });
    }),
  }),
  organization: router({
    requestOffer: protectedProcedure.input(z.object({ offerId: z.number().int().positive(), note: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const profile = await requireRole(ctx.user.id, "organization");
      const offer = await getRescueOffer(input.offerId);
      if (!offer || offer.status !== "available") throw new TRPCError({ code: "BAD_REQUEST", message: "This offer is no longer available." });
      return requestOffer(input.offerId, profile.id, input.note);
    }),
    acceptOffer: protectedProcedure.input(z.object({ offerId: z.number().int().positive(), collectionMode: z.enum(["self", "volunteer"]) })).mutation(async ({ ctx, input }) => {
      const profile = await requireRole(ctx.user.id, "organization");
      const offer = await getRescueOffer(input.offerId);
      if (!offer || !["available", "requested"].includes(offer.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "This offer is no longer available." });
      return acceptOffer(input.offerId, profile.id, input.collectionMode);
    }),
  }),
  handoff: router({
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getHandoff(input.id)),
    advance: protectedProcedure.input(z.object({ id: z.number().int().positive(), nextStatus: z.enum(["handoff_arranged", "picked_up", "on_the_way", "delivered", "completed", "issue_reported"]), note: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const handoff = await getHandoff(input.id);
      if (!handoff) throw new TRPCError({ code: "NOT_FOUND", message: "Handoff not found." });
      const offer = await getRescueOffer(handoff.offerId);
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found." });
      if (!allowedTransitions[offer.status].includes(input.nextStatus)) throw new TRPCError({ code: "BAD_REQUEST", message: "That handoff step is not available yet." });
      const actor = await getProfileForUser(ctx.user.id);
      return advanceHandoff(input.id, input.nextStatus, actor?.id, input.note);
    }),
  }),
  notifications: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileForUser(ctx.user.id);
      return profile ? listNotifications(profile.id) : [];
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const profile = await getProfileForUser(ctx.user.id);
      if (profile) await markNotificationRead(profile.id, input.id);
      return { success: true };
    }),
  }),
  admin: router({
    impact: adminProcedure.query(() => getImpactSummary()),
  }),
});

export type AppRouter = typeof appRouter;
