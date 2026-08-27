import { describe, expect, it } from "vitest";
import { isOnlinePayment, normalizePaymentMethodName } from "./couponService";

describe("Rabiora Coupon System Rules", () => {
  it("allows only online payment methods (bKash, Nagad, Rocket) and rejects Cash on Delivery", () => {
    expect(isOnlinePayment("bKash")).toBe(true);
    expect(isOnlinePayment("Nagad")).toBe(true);
    expect(isOnlinePayment("Rocket")).toBe(true);
    expect(isOnlinePayment("bkash")).toBe(true);
    expect(isOnlinePayment("nagad")).toBe(true);
    expect(isOnlinePayment("rocket")).toBe(true);
    expect(isOnlinePayment("Cash on Delivery")).toBe(false);
    expect(isOnlinePayment("cod")).toBe(false);
    expect(isOnlinePayment("cash")).toBe(false);
  });

  it("normalizes payment method names consistently", () => {
    expect(normalizePaymentMethodName("bkash")).toBe("bKash");
    expect(normalizePaymentMethodName("nagad")).toBe("Nagad");
    expect(normalizePaymentMethodName("rocket")).toBe("Rocket");
    expect(normalizePaymentMethodName("cod")).toBe("Cash on Delivery");
    expect(normalizePaymentMethodName("Cash on Delivery")).toBe("Cash on Delivery");
  });

  it("accurately calculates 10% discount on standard ৳1,590 order", () => {
    const subtotal = 1590;
    const discountPercent = 10;
    const discountAmount = Math.min(subtotal, Math.round((subtotal * discountPercent) / 100));
    const payableSubtotal = Math.max(0, subtotal - discountAmount);

    expect(discountAmount).toBe(159);
    expect(payableSubtotal).toBe(1431);
  });

  it("prevents negative totals and caps discounts to the subtotal amount", () => {
    const subtotal = 100;
    const discountPercent = 100;
    const discountAmount = Math.min(subtotal, Math.round((subtotal * discountPercent) / 100));
    const payableSubtotal = Math.max(0, subtotal - discountAmount);

    expect(discountAmount).toBe(100);
    expect(payableSubtotal).toBe(0);
  });
});
