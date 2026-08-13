import { describe, expect, it } from "vitest";
import { clickToWhatsAppProvider } from "./whatsapp";

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
});
