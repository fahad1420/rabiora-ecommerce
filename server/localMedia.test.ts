import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { removeLocalProductImage, saveLocalProductImage } from "./localMedia";

const originalUploadsDir = process.env.UPLOADS_DIR;
let temporaryRoot = "";

afterEach(async () => {
  if (temporaryRoot) await fs.rm(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = "";
  if (originalUploadsDir === undefined) delete process.env.UPLOADS_DIR;
  else process.env.UPLOADS_DIR = originalUploadsDir;
});

describe("portable local product image storage", () => {
  it("writes and removes administrator image files without Manus storage", async () => {
    temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "rabiora-media-"));
    process.env.UPLOADS_DIR = temporaryRoot;
    const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9J4N8AAAAASUVORK5CYII=", "base64");

    const stored = await saveLocalProductImage(42, onePixelPng, "image/png", "new product.png");
    expect(stored.url).toMatch(/^\/uploads\/images\/products\/42\//);
    expect(stored.key).toMatch(/^products\/42\//);
    await expect(fs.stat(path.join(temporaryRoot, stored.key))).resolves.toMatchObject({ size: onePixelPng.length });

    await removeLocalProductImage(stored.key);
    await expect(fs.stat(path.join(temporaryRoot, stored.key))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
