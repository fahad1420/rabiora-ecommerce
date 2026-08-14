import { describe, expect, it, vi } from "vitest";
import { clickToWhatsAppProvider, createCustomerHandoffSafely, type OrderNotificationProvider } from "./whatsapp";

describe("Click-to-WhatsApp order handoff", () => {
  it("encodes the order number, customer details, product quantity, payment and total without credentials", () => {
    const handoff = clickToWhatsAppProvider.createCustomerHandoff({
      orderNumber: "RAB-TEST-123",
      customerName: "Test Customer",
      customerPhone: "8801700000000",
      districtArea: "Dhaka",
      fullAddress: "Test delivery address",
      paymentMethod: "Cash on Delivery",
      totalTaka: 1590,
      items: [{ name: "Rabiora Three Piece", quantity: 2, lineTotalTaka: 1590 }],
    });
    expect(handoff.url).toContain("https://wa.me/8801349529274?text=");
    expect(decodeURIComponent(handoff.url)).toContain("RAB-TEST-123");
    expect(decodeURIComponent(handoff.url)).toContain("2 × Rabiora Three Piece");
    expect(handoff.message).toContain("Cash on Delivery");
  });

  it("does not throw when an alternate provider boundary unexpectedly fails", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failingProvider: OrderNotificationProvider = {
      createCustomerHandoff: () => { throw new Error("provider unavailable"); },
    };
    const handoff = createCustomerHandoffSafely(failingProvider, {
      orderNumber: "RAB-FAIL-SAFE",
      customerName: "Test Customer",
      customerPhone: "01700000000",
      districtArea: "Dhaka",
      fullAddress: "Safe test address",
      paymentMethod: "Cash on Delivery",
      totalTaka: 1590,
      items: [{ name: "Test item", quantity: 1, lineTotalTaka: 1590 }],
    });
    expect(handoff).toBeNull();
    expect(warning).toHaveBeenCalledWith("[WhatsApp] Click-to-WhatsApp handoff generation failed after order creation.", expect.any(Error));
    warning.mockRestore();
  });
});
