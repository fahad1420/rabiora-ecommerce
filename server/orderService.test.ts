import { describe, expect, it } from "vitest";
import { assertManualPaymentEvidence, calculateDeliveryCharge, manualPaymentRequired, validateOrderStock } from "./orderService";

describe("Rabiora checkout rules", () => {
  it("applies the announced free delivery rule inside Dhaka and the configured outside-Dhaka charge", () => {
    expect(calculateDeliveryCharge("Tongi, Gazipur, Dhaka")).toBe(0);
    expect(calculateDeliveryCharge("Chattogram")).toBe(120);
  });
  it("requires transaction evidence only for the three manual wallet methods", () => {
    expect(manualPaymentRequired("bKash")).toBe(true);
    expect(manualPaymentRequired("Nagad")).toBe(true);
    expect(manualPaymentRequired("Rocket")).toBe(true);
    expect(manualPaymentRequired("Cash on Delivery")).toBe(false);
  });

  it("rejects incomplete manual-wallet evidence while allowing cash on delivery", () => {
    expect(() => assertManualPaymentEvidence("bKash", "", 1590)).toThrow(/Transaction ID and submitted amount/);
    expect(() => assertManualPaymentEvidence("Nagad", "TXN-001", 0)).toThrow(/Transaction ID and submitted amount/);
    expect(() => assertManualPaymentEvidence("Rocket", undefined, undefined)).toThrow(/Transaction ID and submitted amount/);
    expect(() => assertManualPaymentEvidence("Cash on Delivery")).not.toThrow();
  });

  it("accepts available stock and rejects missing, unavailable, or insufficient cart lines", () => {
    expect(() => validateOrderStock([{ productId: 1, quantity: 2 }], [{ id: 1, isInStock: true, stockQuantity: 2 }])).not.toThrow();
    expect(() => validateOrderStock([{ productId: 1, quantity: 3 }], [{ id: 1, isInStock: true, stockQuantity: 2 }])).toThrow(/no longer have enough stock/);
    expect(() => validateOrderStock([{ productId: 1, quantity: 1 }], [{ id: 1, isInStock: false, stockQuantity: 5 }])).toThrow(/no longer have enough stock/);
    expect(() => validateOrderStock([{ productId: 99, quantity: 1 }], [{ id: 1, isInStock: true, stockQuantity: 5 }])).toThrow(/no longer have enough stock/);
  });
});
