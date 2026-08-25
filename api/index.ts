import "dotenv/config";
import type { Request, Response } from "express";
import { app } from "../server/app";
import { connectMongo } from "../server/config/db";

export default async function handler(req: Request, res: Response) {
  await connectMongo();
  return app(req, res);
}

