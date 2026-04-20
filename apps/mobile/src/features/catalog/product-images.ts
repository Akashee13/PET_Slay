import type { ProductCard, ProductDetail } from "@pet-slay/types";

export const FALLBACK_PRODUCT_IMAGE =
  "https://image.pollinations.ai/prompt/minimal%20fashion%20lookbook%20card?width=900&height=1200&nologo=true";

export function getProductImageUrls(product: ProductCard | ProductDetail, fallbackUrl = FALLBACK_PRODUCT_IMAGE): string[] {
  const candidates = [product.coverImageUrl, ...(product.imageUrls ?? [])]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  const unique = Array.from(new Set(candidates)).slice(0, 5);
  return unique.length > 0 ? unique : [fallbackUrl];
}

export function getPrimaryProductImage(product: ProductCard | ProductDetail, fallbackUrl = FALLBACK_PRODUCT_IMAGE): string {
  return getProductImageUrls(product, fallbackUrl)[0];
}
