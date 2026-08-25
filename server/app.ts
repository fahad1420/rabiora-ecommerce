import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { applyCorsPolicy } from "./_core/cors";
import { getLocalImagesRoot } from "./localMedia";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { connectMongo } from "./config/db";

export function createExpressApp(): express.Express {
  const app: express.Express = express();
  app.set("trust proxy", 1);

  // Apply CORS policy for separated frontend
  app.use(applyCorsPolicy);

  // Configure body parser with JSON support
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Static uploads (fallthrough allows next route handlers if file is not local)
  app.use("/uploads/images", express.static(getLocalImagesRoot(), { fallthrough: true, maxAge: "7d" }));

  // Connect MongoDB on requests
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectMongo();
      next();
    } catch (err) {
      console.error("[MongoDB] Middleware connection error:", err);
      next();
    }
  });

  // Health check endpoint (handles /api/health, /health, /api, /)
  app.get(["/api/health", "/health", "/api", "/"], (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OAuth routes if configured
  registerOAuthRoutes(app);

  // tRPC API middleware (handles both /api/trpc and /trpc under rewrites)
  app.use(
    ["/api/trpc", "/trpc"],
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[Express Error]", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err?.message,
    });
  });

  return app;
}

export const app: express.Express = createExpressApp();
export default app;
