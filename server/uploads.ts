import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ServerConfig } from "./config";
export async function uploadImage(buffer: Buffer, config: ServerConfig): Promise<string> {
  let optimized: Buffer;
  try {
    const input = sharp(buffer, {
      limitInputPixels: 25000000,
      animated: false,
    });
    const meta = await input.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || "")) throw new Error("Unsupported format");
    optimized = await input
      .rotate()
      .resize(1600, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw Object.assign(new Error("Invalid image"), { status: 400 });
  }
  if (config.imageStorage === "cloudinary") {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return new Promise((resolveUrl, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "terra/products", resource_type: "image", timeout: 60000 },
        (error, result) => {
          if (error || !result) reject(error || new Error("Image upload failed"));
          else resolveUrl(result.secure_url);
        },
      );
      stream.end(optimized);
    });
  }
  const name = `${randomUUID()}.webp`;
  await writeFile(resolve(config.uploadDir || "uploads", name), optimized);
  return `/media/${name}`;
}
