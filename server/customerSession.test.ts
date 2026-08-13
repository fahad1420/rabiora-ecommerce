import { describe, expect, it } from "vitest";
import { hashPassword, isValidCustomerPassword, normalizeBangladeshPhone, verifyPassword } from "./customerSession";

describe("Rabiora customer credential rules", () => {
  it("normalizes accepted Bangladesh mobile formats", () => {
    expect(normalizeBangladeshPhone("01712-345678")).toBe("+8801712345678");
    expect(normalizeBangladeshPhone("+880 1712 345678")).toBe("+8801712345678");
  });

  it("rejects invalid phone numbers and weak passwords", () => {
    expect(normalizeBangladeshPhone("123456")).toBeNull();
    expect(isValidCustomerPassword("short")).toBe(false);
    expect(isValidCustomerPassword("secure-password")).toBe(true);
  });

  it("hashes passwords and verifies them without storing plaintext", async () => {
    const hash = await hashPassword("secure-password");
    expect(hash).not.toContain("secure-password");
    await expect(verifyPassword("secure-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", hash)).resolves.toBe(false);
  });
});
