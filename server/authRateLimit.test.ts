import { describe, expect, it } from "vitest";
import { enforceAuthRateLimit, resetAuthRateLimit } from "./authRateLimit";

describe("authentication rate limiter", () => {
  it("allows a bounded number of attempts and can reset after success", () => {
    const key = `test:${Date.now()}`;
    for (let attempt = 0; attempt < 8; attempt += 1) enforceAuthRateLimit(key);
    expect(() => enforceAuthRateLimit(key)).toThrow(/Too many account attempts/);
    resetAuthRateLimit(key);
    expect(() => enforceAuthRateLimit(key)).not.toThrow();
  });
});
