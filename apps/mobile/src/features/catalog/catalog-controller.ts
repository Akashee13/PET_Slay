import type { ProductCard, ProductDetail } from "@pet-slay/types";
import type { AppLanguage } from "../../i18n";

import type { BuyerApiClient } from "../../services/buyer-api";
import type { Analytics } from "../../services/analytics";

export type CatalogController = {
  loadProducts: (options?: { language?: AppLanguage }) => Promise<ProductCard[]>;
  loadProductDetail: (productId: string, options?: { language?: AppLanguage }) => Promise<ProductDetail>;
};

export function createCatalogController(options: { api: BuyerApiClient; analytics?: Analytics }): CatalogController {
  return {
    async loadProducts(loadOptions) {
      try {
        const products = await options.api.listProducts({ language: loadOptions?.language });
        options.analytics?.track("catalog_loaded", { count: products.length, language: loadOptions?.language });
        return products;
      } catch (error) {
        options.analytics?.recordError("catalog_load_failed", error, { language: loadOptions?.language });
        throw error;
      }
    },
    async loadProductDetail(productId, loadOptions) {
      try {
        const product = await options.api.getProductDetail(productId, { language: loadOptions?.language });
        options.analytics?.track("product_detail_opened", { productId, language: loadOptions?.language });
        return product;
      } catch (error) {
        options.analytics?.recordError("product_detail_failed", error, { productId, language: loadOptions?.language });
        throw error;
      }
    },
  };
}
