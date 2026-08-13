import { describe, expect, it } from "vitest";
import { canAdvanceOrderStatus } from "./adminService";

describe("Rabiora order-status policy", () => {
  it("permits only the approved forward-only fulfilment pipeline", () => {
    expect(canAdvanceOrderStatus("pending", "confirmed")).toBe(true);
    expect(canAdvanceOrderStatus("confirmed", "shipped")).toBe(true);
    expect(canAdvanceOrderStatus("shipped", "delivered")).toBe(true);
    expect(canAdvanceOrderStatus("pending", "shipped")).toBe(false);
    expect(canAdvanceOrderStatus("delivered", "confirmed")).toBe(false);
  });
});
