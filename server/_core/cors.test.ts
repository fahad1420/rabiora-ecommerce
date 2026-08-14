import { describe, expect, it } from "vitest";
import { isAllowedCorsOrigin } from "./cors";

describe("CORS origin policy", () => {
  const requestOrigin = "https://store.example.test";

  it("allows same-origin and non-browser requests", () => {
    expect(isAllowedCorsOrigin(requestOrigin, requestOrigin)).toBe(true);
    expect(isAllowedCorsOrigin(undefined, requestOrigin)).toBe(true);
  });

  it("allows only exact origins in the configured allow-list", () => {
    const explicitOrigins = "https://ops.example.test, https://preview.example.test";
    expect(isAllowedCorsOrigin("https://ops.example.test", requestOrigin, explicitOrigins)).toBe(true);
    expect(isAllowedCorsOrigin("https://preview.example.test", requestOrigin, explicitOrigins)).toBe(true);
    expect(isAllowedCorsOrigin("https://untrusted.example.test", requestOrigin, explicitOrigins)).toBe(false);
  });

  it("rejects a cross-origin request when no allow-list is configured", () => {
    expect(isAllowedCorsOrigin("https://untrusted.example.test", requestOrigin, "")).toBe(false);
  });
});
