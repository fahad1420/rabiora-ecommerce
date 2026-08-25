import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { applyCorsPolicy } from "./_core/cors";
import { getLocalImagesRoot } from "./localMedia";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { connectMongo } from "./config/db";

export function createExpressApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Apply CORS policy for separated frontend
  app.use(applyCorsPolicy);

  // Configure body parser with JSON support
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Static uploads
  app.use("/uploads/images", express.static(getLocalImagesRoot(), { fallthrough: false, maxAge: "7d" }));

  // Connect MongoDB on requests or initialization
  app.use(async (req, res, next) => {
    try {
      await connectMongo();
      next();
    } catch (err) {
      console.error("[MongoDB] Middleware connection error:", err);
      next();
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OAuth routes if configured
  registerOAuthRoutes(app);

  // tRPC API middleware
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

export const app = createExpressApp();
export default app;

