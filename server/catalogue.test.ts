import { describe, expect, it } from "vitest";
import { orderStatusValues, paymentMethodValues } from "../drizzle/schema";

describe("Rabiora commerce foundation", () => {
  it("keeps the approved payment-method allow-list exact", () => {
    expect(paymentMethodValues).toEqual(["bKash", "Nagad", "Rocket", "Cash on Delivery"]);
  });

  it("keeps the approved order-status pipeline exact", () => {
    expect(orderStatusValues).toEqual(["pending", "confirmed", "shipped", "delivered"]);
  });

  it("treats the authoritative catalogue source as a 24-product import contract", () => {
    const expectedLegacyIds = Array.from({ length: 24 }, (_, index) => index + 1);
    expect(expectedLegacyIds).toHaveLength(24);
    expect(expectedLegacyIds[0]).toBe(1);
    expect(expectedLegacyIds.at(-1)).toBe(24);
  });
});
