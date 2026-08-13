import { describe, expect, it } from "vitest";
import { calculateDeliveryCharge, manualPaymentRequired } from "./orderService";

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
});
