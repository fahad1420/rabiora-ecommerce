import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getCustomerFromRequest, RabioraCustomer } from "../customerSession";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: RabioraCustomer | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: RabioraCustomer | null = null;

  // 1. Check native customer session (rabiora_customer_session / Bearer token)
  try {
    const customer = await getCustomerFromRequest(opts.req);
    if (customer) {
      user = customer;
    }
  } catch {
    // Ignore error
  }

  // 2. Fallback to OAuth / Manus session (app_session_id)
  if (!user) {
    try {
      const authUser = await sdk.authenticateRequest(opts.req);
      if (authUser) {
        user = {
          id: authUser._id ? authUser._id.toString() : (authUser.id ? String(authUser.id) : authUser.openId),
          openId: authUser.openId,
          name: authUser.name ?? null,
          email: authUser.email ?? null,
          phone: authUser.phone ?? null,
          role: authUser.role ?? "user",
        };
      }
    } catch {
      // Authentication is optional for public procedures
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}