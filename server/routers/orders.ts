import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createOrder, getCustomerOrderConfirmation, getCustomerOrderDetail, getOrderConfirmation, listCustomerOrders, manualPaymentRequired, PAYMENT_METHODS } from "../orderService";
import { getCustomerFromRequest, hasGuestOrderConfirmationAccess, normalizeBangladeshPhone, setGuestOrderConfirmation } from "../customerSession";
import { resolveCartIdentity } from "../cartService";
import { clickToWhatsAppProvider, createCustomerHandoffSafely } from "../whatsapp";
import { publicProcedure, router } from "../_core/trpc";

const guestToken = z.string().regex(/^[a-zA-Z0-9_-]{20,128}$/).optional();

export const orderRouter = router({
  checkout: publicProcedure.input(z.object({
    anonymousToken: guestToken,
    customerName: z.string().trim().min(2).max(160),
    customerPhone: z.string().trim().min(11).max(20).refine((value) => Boolean(normalizeBangladeshPhone(value)), "Enter a valid Bangladesh phone number."),
    districtArea: z.string().trim().min(2).max(180),
    fullAddress: z.string().trim().min(8).max(1000),
    paymentMethod: z.enum(PAYMENT_METHODS),
    transactionId: z.string().trim().min(3).max(120).optional(),
    submittedAmountTaka: z.number().int().positive().max(1_000_000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(ctx.req, ctx.user, input.anonymousToken);
    const normalizedPhone = normalizeBangladeshPhone(input.customerPhone)!;
    const created = await createOrder(identity, { ...input, customerPhone: normalizedPhone });
    if (!identity.userId) await setGuestOrderConfirmation(ctx.res, created.orderNumber);
    const clickToWhatsApp = createCustomerHandoffSafely(clickToWhatsAppProvider, {
      orderNumber: created.orderNumber,
      customerName: input.customerName,
      customerPhone: normalizedPhone,
      districtArea: input.districtArea,
      fullAddress: input.fullAddress,
      totalTaka: created.totalTaka,
      paymentMethod: created.paymentMethod,
      items: created.items,
    });
    return { ...created, clickToWhatsAppUrl: clickToWhatsApp?.url ?? null };
  }),
  confirmation: publicProcedure.input(z.object({ orderNumber: z.string().trim().regex(/^RAB-[A-Z0-9_-]+$/) })).query(async ({ ctx, input }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (customer) return getCustomerOrderConfirmation(customer.id, input.orderNumber);
    if (!(await hasGuestOrderConfirmationAccess(ctx.req, input.orderNumber))) throw new TRPCError({ code: "FORBIDDEN", message: "This order confirmation is not available in the current session." });
    return getOrderConfirmation(input.orderNumber);
  }),
  mine: publicProcedure.query(async ({ ctx }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to view order history." });
    return listCustomerOrders(customer.id);
  }),
  detail: publicProcedure.input(z.object({ orderNumber: z.string().trim().regex(/^RAB-[A-Z0-9_-]+$/) })).query(async ({ ctx, input }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to view order details." });
    return getCustomerOrderDetail(customer.id, input.orderNumber);
  }),
  paymentRules: publicProcedure.query(() => ({ methods: PAYMENT_METHODS, manualPaymentRequired })),
});
