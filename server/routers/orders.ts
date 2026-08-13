import { z } from "zod";
import { createOrder, getOrderConfirmation, manualPaymentRequired, PAYMENT_METHODS } from "../orderService";
import { normalizeBangladeshPhone } from "../customerSession";
import { resolveCartIdentity } from "../cartService";
import { clickToWhatsAppProvider } from "../whatsapp";
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
    const clickToWhatsApp = clickToWhatsAppProvider.createCustomerHandoff({
      orderNumber: created.orderNumber,
      customerName: input.customerName,
      customerPhone: normalizedPhone,
      districtArea: input.districtArea,
      fullAddress: input.fullAddress,
      totalTaka: created.totalTaka,
      paymentMethod: created.paymentMethod,
      items: created.items,
    });
    return { ...created, clickToWhatsAppUrl: clickToWhatsApp.url };
  }),
  confirmation: publicProcedure.input(z.object({ orderNumber: z.string().trim().regex(/^RAB-[A-Z0-9-]+$/) })).query(({ input }) => getOrderConfirmation(input.orderNumber)),
  paymentRules: publicProcedure.query(() => ({ methods: PAYMENT_METHODS, manualPaymentRequired })),
});
