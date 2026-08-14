import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const orderService = vi.hoisted(() => ({
  createOrder: vi.fn(),
  getOrderConfirmation: vi.fn(),
  getCustomerOrderConfirmation: vi.fn(),
  getCustomerOrderDetail: vi.fn(),
  listCustomerOrders: vi.fn(),
  resolveCartIdentity: vi.fn(),
  getCustomerFromRequest: vi.fn(),
  hasGuestOrderConfirmationAccess: vi.fn(),
  setGuestOrderConfirmation: vi.fn(),
}));

vi.mock("./orderService", () => ({
  PAYMENT_METHODS: ["bKash", "Nagad", "Rocket", "Cash on Delivery"],
  manualPaymentRequired: (method: string) => method !== "Cash on Delivery",
  createOrder: orderService.createOrder,
  getOrderConfirmation: orderService.getOrderConfirmation,
  getCustomerOrderConfirmation: orderService.getCustomerOrderConfirmation,
  getCustomerOrderDetail: orderService.getCustomerOrderDetail,
  listCustomerOrders: orderService.listCustomerOrders,
}));
vi.mock("./cartService", () => ({ resolveCartIdentity: orderService.resolveCartIdentity }));
vi.mock("./customerSession", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./customerSession")>()),
  getCustomerFromRequest: orderService.getCustomerFromRequest,
  hasGuestOrderConfirmationAccess: orderService.hasGuestOrderConfirmationAccess,
  setGuestOrderConfirmation: orderService.setGuestOrderConfirmation,
}));

import { orderRouter } from "./routers/orders";

const anonymousToken = "acceptance_checkout_token_123";
const checkoutInput = {
  anonymousToken,
  customerName: "Acceptance Customer",
  customerPhone: "01700000000",
  districtArea: "Dhaka",
  fullAddress: "Safe acceptance-test address",
  paymentMethod: "Cash on Delivery" as const,
};

function caller() {
  return orderRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

describe("checkout router validation and handoff contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderService.resolveCartIdentity.mockResolvedValue({ anonymousToken });
    orderService.getCustomerFromRequest.mockResolvedValue(null);
    orderService.hasGuestOrderConfirmationAccess.mockResolvedValue(false);
    orderService.createOrder.mockResolvedValue({
      orderNumber: "RAB-ACCEPT-001",
      totalTaka: 1590,
      deliveryChargeTaka: 0,
      paymentMethod: "Cash on Delivery",
      items: [{ name: "Acceptance item", quantity: 1, lineTotalTaka: 1590 }],
    });
  });

  it("creates an order through the validated route and returns a Click-to-WhatsApp handoff URL", async () => {
    const result = await caller().checkout(checkoutInput);
    expect(orderService.createOrder).toHaveBeenCalledWith({ anonymousToken }, expect.objectContaining({ customerName: "Acceptance Customer", customerPhone: "+8801700000000", paymentMethod: "Cash on Delivery" }));
    expect(orderService.setGuestOrderConfirmation).toHaveBeenCalledWith(expect.anything(), "RAB-ACCEPT-001");
    expect(result).toMatchObject({ orderNumber: "RAB-ACCEPT-001", clickToWhatsAppUrl: expect.stringContaining("https://wa.me/8801349529274?text=") });
  });

  it("rejects an invalid Bangladesh phone number before creating an order", async () => {
    await expect(caller().checkout({ ...checkoutInput, customerPhone: "not-a-phone" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it("rejects an unsupported payment method before creating an order", async () => {
    await expect(caller().checkout({ ...checkoutInput, paymentMethod: "Card" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it("accepts confirmation lookups for generated order numbers containing underscores", async () => {
    orderService.hasGuestOrderConfirmationAccess.mockResolvedValue(true);
    orderService.getOrderConfirmation.mockResolvedValue({ orderNumber: "RAB-MSS7IVDJ-E5P_P", totalTaka: 1590, deliveryChargeTaka: 0, paymentMethod: "Cash on Delivery", status: "pending" });
    await expect(caller().confirmation({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).resolves.toMatchObject({ orderNumber: "RAB-MSS7IVDJ-E5P_P" });
    expect(orderService.getOrderConfirmation).toHaveBeenCalledWith("RAB-MSS7IVDJ-E5P_P");
  });

  it("rejects guest confirmation lookup without the matching session-bound confirmation proof", async () => {
    await expect(caller().confirmation({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(orderService.getOrderConfirmation).not.toHaveBeenCalled();
  });

  it("rejects guest access to protected customer order details", async () => {
    await expect(caller().detail({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(orderService.getCustomerOrderDetail).not.toHaveBeenCalled();
  });

  it("rejects guest access to customer order history", async () => {
    await expect(caller().mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(orderService.listCustomerOrders).not.toHaveBeenCalled();
  });

  it("loads order history only for the active customer identity", async () => {
    orderService.getCustomerFromRequest.mockResolvedValue({ id: 41, role: "user" });
    orderService.listCustomerOrders.mockResolvedValue([]);
    await expect(caller().mine()).resolves.toEqual([]);
    expect(orderService.listCustomerOrders).toHaveBeenCalledWith(41);
  });

  it("loads an individual order only through the active customer identity", async () => {
    orderService.getCustomerFromRequest.mockResolvedValue({ id: 41, role: "user" });
    orderService.getCustomerOrderDetail.mockResolvedValue({ orderNumber: "RAB-MSS7IVDJ-E5P_P", createdAt: new Date("2026-08-14T00:00:00Z"), status: "shipped", subtotalTaka: 1500, deliveryChargeTaka: 120, totalTaka: 1620, paymentMethod: "bKash", customerName: "Order Owner", customerPhone: "+8801700000000", districtArea: "Dhaka", fullAddress: "Verified address", items: [{ id: 1, productName: "Premium Three Piece", quantity: 1, unitPriceTaka: 1500, lineTotalTaka: 1500 }], payment: { transactionId: "TXN-123", submittedAmountTaka: 1620 }, statusHistory: [{ id: 1, nextStatus: "pending", adminNote: "Order placed", createdAt: new Date("2026-08-14T00:00:00Z") }, { id: 2, nextStatus: "shipped", adminNote: "Handed to courier", createdAt: new Date("2026-08-14T01:00:00Z") }] });
    await expect(caller().detail({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).resolves.toMatchObject({ status: "shipped", subtotalTaka: 1500, deliveryChargeTaka: 120, totalTaka: 1620, payment: { transactionId: "TXN-123" }, items: [{ unitPriceTaka: 1500, quantity: 1 }], statusHistory: [{ nextStatus: "pending" }, { nextStatus: "shipped" }] });
    expect(orderService.getCustomerOrderDetail).toHaveBeenCalledWith(41, "RAB-MSS7IVDJ-E5P_P");
  });

  it("does not leak another customer’s order when the owned-detail service rejects it", async () => {
    orderService.getCustomerFromRequest.mockResolvedValue({ id: 41, role: "user" });
    orderService.getCustomerOrderDetail.mockRejectedValue(new TRPCError({ code: "NOT_FOUND", message: "Order not found." }));
    await expect(caller().detail({ orderNumber: "RAB-OTHER-CUSTOMER" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(orderService.getCustomerOrderDetail).toHaveBeenCalledWith(41, "RAB-OTHER-CUSTOMER");
  });

  it("uses authenticated customer ownership for confirmation instead of guest confirmation proof", async () => {
    orderService.getCustomerFromRequest.mockResolvedValue({ id: 41, role: "user" });
    orderService.getCustomerOrderConfirmation.mockResolvedValue({ orderNumber: "RAB-MSS7IVDJ-E5P_P", status: "confirmed" });
    await expect(caller().confirmation({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).resolves.toMatchObject({ status: "confirmed" });
    expect(orderService.getCustomerOrderConfirmation).toHaveBeenCalledWith(41, "RAB-MSS7IVDJ-E5P_P");
    expect(orderService.hasGuestOrderConfirmationAccess).not.toHaveBeenCalled();
  });
});
