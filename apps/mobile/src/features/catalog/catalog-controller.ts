import type { ProductCard, ProductDetail } from "@pet-slay/types";

import type { BuyerApiClient } from "../../services/buyer-api";

export type CatalogController = {
  loadProducts: () => Promise<ProductCard[]>;
  loadProductDetail: (productId: string) => Promise<ProductDetail>;
};

export function createCatalogController(options: { api: BuyerApiClient }): CatalogController {
  return {
    loadProducts() {
      return options.api.listProducts();
    },
    loadProductDetail(productId) {
      return options.api.getProductDetail(productId);
    },
  };
}
