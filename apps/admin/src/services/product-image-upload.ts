import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAdminSupabaseConfig, isAdminSupabaseConfigured } from "@/src/services/supabase";

const DEFAULT_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "product-images";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let browserSupabaseClient: SupabaseClient | null = null;

function getBrowserSupabaseClient(): SupabaseClient {
  if (!isAdminSupabaseConfigured()) {
    throw new Error("supabase_not_configured_for_upload");
  }

  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const config = getAdminSupabaseConfig();
  browserSupabaseClient = createClient(config.url, config.anonKey);
  return browserSupabaseClient;
}

function sanitizeSegment(value: string): string {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-");
  return normalized.replace(/(^-|-$)+/g, "") || "product";
}

function inferExtension(file: File): string {
  if (file.type === "image/png") {
    return "png";
  }
  if (file.type === "image/webp") {
    return "webp";
  }
  return "jpg";
}

function validateImageFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`unsupported_image_type_${file.type || "unknown"}`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("image_file_too_large_max_8mb");
  }
}

export type UploadProductImagesOptions = {
  productTitleHint?: string;
};

export async function uploadProductImages(files: File[], options?: UploadProductImagesOptions): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  const supabase = getBrowserSupabaseClient();
  const productSegment = sanitizeSegment(options?.productTitleHint ?? "product");
  const timestamp = Date.now();

  const imageUrls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    validateImageFile(file);

    const extension = inferExtension(file);
    const filePath = `products/${productSegment}/${timestamp}-${index + 1}.${extension}`;

    const { error } = await supabase.storage.from(DEFAULT_STORAGE_BUCKET).upload(filePath, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (error) {
      throw new Error(`image_upload_failed_${error.message}`);
    }

    const { data } = supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(filePath);
    if (!data.publicUrl) {
      throw new Error("image_public_url_unavailable");
    }

    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}
