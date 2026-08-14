import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { customerRouter } from "./routers/customer";

function caller() {
  return customerRouter.createCaller({
    user: null,
    req: { ip: "127.0.0.1", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });
}

describe("customer authentication route guards", () => {
  it("rejects invalid registration data before any customer account can be created", async () => {
    await expect(caller().register({
      name: "A",
      phone: "not-a-bangladesh-phone",
      password: "short",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an invalid login phone before credential lookup", async () => {
    await expect(caller().login({ phone: "invalid", password: "password123" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a customer session to update a profile", async () => {
    await expect(caller().updateProfile({ name: "Acceptance Customer", email: "customer@example.test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
