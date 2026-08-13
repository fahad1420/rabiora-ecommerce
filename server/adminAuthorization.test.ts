import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin router authorization", () => {
  it("rejects a signed-in non-administrator before running an admin query", async () => {
    const caller = appRouter.createCaller({
      user: { id: 99, openId: "non-admin", name: "Customer", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.admin.products.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
