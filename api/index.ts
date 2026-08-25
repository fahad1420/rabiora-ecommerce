import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    const { app } = await import("../server/app");
    return app(req, res);
  } catch (error: any) {
    console.error("[Vercel API Handler Error]", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Vercel API Handler Error",
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
    }
  }
}
