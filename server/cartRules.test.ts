import { describe, expect, it } from "vitest";
import { assertCartStock, mergedQuantities, nextCartQuantity, shouldRemoveCartItem } from "./cartRules";

describe("Rabiora cart rules", () => {
  it("limits cart additions and quantity updates to available stock", () => {
    expect(nextCartQuantity(1, 2, 5, true)).toBe(3);
    expect(() => nextCartQuantity(4, 2, 5, true)).toThrow(/exceeds available stock/);
    expect(() => assertCartStock(false, 5, 1)).toThrow(/out of stock/);
  });
  it("treats quantity zero as a removal and combines guest cart quantities by product", () => {
    expect(shouldRemoveCartItem(0)).toBe(true);
    expect(shouldRemoveCartItem(1)).toBe(false);
    expect(mergedQuantities([{ productId: 1, quantity: 1 }], [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }])).toEqual([{ productId: 1, quantity: 3 }, { productId: 2, quantity: 1 }]);
  });
});
