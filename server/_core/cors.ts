import type { NextFunction, Request, Response } from "express";

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, X-TRPC-Source";

function configuredOrigins(value = process.env.CORS_ALLOWED_ORIGINS): Set<string> {
  return new Set((value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean));
}

export function isAllowedCorsOrigin(origin: string | undefined, requestOrigin: string, explicitOrigins = process.env.CORS_ALLOWED_ORIGINS) {
  if (!origin) return true;
  return origin === requestOrigin || configuredOrigins(explicitOrigins).has(origin);
}

/**
 * Browser API policy: allow same-origin requests and an optional, explicit
 * CORS_ALLOWED_ORIGINS allow-list. Cross-origin requests never receive
 * credential access unless their exact origin has been approved.
 */
export function applyCorsPolicy(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;

  if (!isAllowedCorsOrigin(origin, requestOrigin)) {
    res.status(403).json({ error: "Cross-origin requests are not allowed." });
    return;
  }

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}
