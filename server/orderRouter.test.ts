import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const orderService = vi.hoisted(() => ({
  createOrder: vi.fn(),
  getOrderConfirmation: vi.fn(),
  listCustomerOrders: vi.fn(),
  resolveCartIdentity: vi.fn(),
}));

vi.mock("./orderService", () => ({
  PAYMENT_METHODS: ["bKash", "Nagad", "Rocket", "Cash on Delivery"],
  manualPaymentRequired: (method: string) => method !== "Cash on Delivery",
  createOrder: orderService.createOrder,
  getOrderConfirmation: orderService.getOrderConfirmation,
  listCustomerOrders: orderService.listCustomerOrders,
}));
vi.mock("./cartService", () => ({ resolveCartIdentity: orderService.resolveCartIdentity }));

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
    orderService.getOrderConfirmation.mockResolvedValue({ orderNumber: "RAB-MSS7IVDJ-E5P_P", totalTaka: 1590, deliveryChargeTaka: 0, paymentMethod: "Cash on Delivery", status: "pending" });
    await expect(caller().confirmation({ orderNumber: "RAB-MSS7IVDJ-E5P_P" })).resolves.toMatchObject({ orderNumber: "RAB-MSS7IVDJ-E5P_P" });
    expect(orderService.getOrderConfirmation).toHaveBeenCalledWith("RAB-MSS7IVDJ-E5P_P");
  });
});
