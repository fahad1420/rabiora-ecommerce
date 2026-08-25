import type { Request, Response } from "express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getCustomerFromRequest, RabioraCustomer } from "../customerSession";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: RabioraCustomer | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const req = opts.req as Request;
  const res = opts.res as Response;
  let user: RabioraCustomer | null = null;

  // 1. Check native customer session (rabiora_customer_session / Bearer token)
  try {
    const customer = await getCustomerFromRequest(req);
    if (customer) {
      user = customer;
    }
  } catch {
    // Ignore error
  }

  // 2. Fallback to OAuth / Manus session (app_session_id)
  if (!user) {
    try {
      const authUser = await sdk.authenticateRequest(req);
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
    req,
    res,
    user,
  };
}