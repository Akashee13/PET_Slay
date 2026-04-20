import type { ProductCard, ProductDetail } from "@pet-slay/types";

import type { BuyerApiClient } from "../../services/buyer-api";
import type { Analytics } from "../../services/analytics";

export type CatalogController = {
  loadProducts: () => Promise<ProductCard[]>;
  loadProductDetail: (productId: string) => Promise<ProductDetail>;
};

export function createCatalogController(options: { api: BuyerApiClient; analytics?: Analytics }): CatalogController {
  return {
    async loadProducts() {
      try {
        const products = await options.api.listProducts();
        options.analytics?.track("catalog_loaded", { count: products.length });
        return products;
      } catch (error) {
        options.analytics?.recordError("catalog_load_failed", error);
        throw error;
      }
    },
    async loadProductDetail(productId) {
      try {
        const product = await options.api.getProductDetail(productId);
        options.analytics?.track("product_detail_opened", { productId });
        return product;
      } catch (error) {
        options.analytics?.recordError("product_detail_failed", error, { productId });
        throw error;
      }
    },
  };
}
