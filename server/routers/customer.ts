import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearCustomerSession, createCustomer, findCustomerByPhone, getCustomerFromRequest, isValidCustomerPassword, normalizeBangladeshPhone, setCustomerSession, updateCustomerProfile, verifyPassword } from "../customerSession";
import { mergeGuestCart, resolveCartIdentity } from "../cartService";
import { enforceAuthRateLimit, resetAuthRateLimit } from "../authRateLimit";
import { router, publicProcedure } from "../_core/trpc";

const phoneSchema = z.string().trim().min(11).max(20).refine((value) => Boolean(normalizeBangladeshPhone(value)), "Enter a valid Bangladesh phone number.");
const guestTokenSchema = z.string().regex(/^[a-zA-Z0-9_-]{20,128}$/).optional();

export const customerRouter = router({
  me: publicProcedure.query(async ({ ctx }) => ctx.user ?? getCustomerFromRequest(ctx.req)),
  register: publicProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    phone: phoneSchema,
    password: z.string().refine(isValidCustomerPassword, "Password must contain 8–72 characters."),
    anonymousToken: guestTokenSchema,
  })).mutation(async ({ ctx, input }) => {
    const rateKey = `register:${ctx.req.ip ?? "unknown"}:${input.phone}`;
    enforceAuthRateLimit(rateKey);
    const existing = await findCustomerByPhone(input.phone);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this phone number." });
    const customer = await createCustomer(input);
    await mergeGuestCart(customer.id, input.anonymousToken);
    await setCustomerSession(ctx.res, customer);
    resetAuthRateLimit(rateKey);
    return customer;
  }),
  login: publicProcedure.input(z.object({ phone: phoneSchema, password: z.string().min(1).max(72), anonymousToken: guestTokenSchema })).mutation(async ({ ctx, input }) => {
    const rateKey = `login:${ctx.req.ip ?? "unknown"}:${input.phone}`;
    enforceAuthRateLimit(rateKey);
    const customer = await findCustomerByPhone(input.phone);
    if (!customer?.passwordHash || !(await verifyPassword(input.password, customer.passwordHash))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Phone number or password is incorrect." });
    }
    await mergeGuestCart(customer.id, input.anonymousToken);
    const sessionCustomer = { id: customer.id, openId: customer.openId, name: customer.name, email: customer.email, phone: customer.phone, role: customer.role };
    await setCustomerSession(ctx.res, sessionCustomer);
    resetAuthRateLimit(rateKey);
    return sessionCustomer;
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearCustomerSession(ctx.res);
    return { success: true as const };
  }),
  updateProfile: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320).optional().or(z.literal("")) })).mutation(async ({ ctx, input }) => {
    const customer = await getCustomerFromRequest(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to update your profile." });
    return updateCustomerProfile(customer.id, input);
  }),
});

export const cartRouter = router({
  get: publicProcedure.input(z.object({ anonymousToken: guestTokenSchema })).query(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(ctx.req, ctx.user, input.anonymousToken);
    const { getCart } = await import("../cartService");
    return getCart(identity);
  }),
  add: publicProcedure.input(z.object({ anonymousToken: guestTokenSchema, productId: z.number().int().positive(), quantity: z.number().int().min(1).max(20).default(1) })).mutation(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(ctx.req, ctx.user, input.anonymousToken);
    const { addCartItem } = await import("../cartService");
    return addCartItem(identity, input.productId, input.quantity);
  }),
  update: publicProcedure.input(z.object({ anonymousToken: guestTokenSchema, productId: z.number().int().positive(), quantity: z.number().int().min(0).max(20) })).mutation(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(ctx.req, ctx.user, input.anonymousToken);
    const { updateCartItem } = await import("../cartService");
    return updateCartItem(identity, input.productId, input.quantity);
  }),
});
