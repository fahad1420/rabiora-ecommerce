import type { NextFunction, Request, Response } from "express";

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, X-TRPC-Source, Accept, Origin";

function configuredOrigins(value = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL): Set<string> {
  const defaults = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"];
  const list = (value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  return new Set([...defaults, ...list]);
}

export function isAllowedCorsOrigin(origin: string | undefined, requestOrigin: string, explicitOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL) {
  if (!origin) return true;
  if (origin === requestOrigin) return true;
  if (configuredOrigins(explicitOrigins).has(origin)) return true;
  // Allow all vercel preview domains if in vercel or configured
  if (origin.endsWith(".vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  return false;
}

/**
 * Express CORS middleware supporting decoupled Frontend on Vercel or localhost.
 */
export function applyCorsPolicy(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;

  if (origin && isAllowedCorsOrigin(origin, requestOrigin)) {
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
