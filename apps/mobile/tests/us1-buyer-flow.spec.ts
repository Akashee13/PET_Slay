import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Language } from "@pet-slay/types";

import { BuyerApiClient, type ApiTransport } from "../src/services/buyer-api.ts";
import { createCatalogController } from "../src/features/catalog/catalog-controller.ts";
import { createLanguageController } from "../src/features/language/language-controller.ts";
import { createOrderController } from "../src/features/orders/order-controller.ts";
import { createRecordingAnalytics } from "../src/services/analytics.ts";
import { createSessionStore } from "../src/state/session-store.ts";

function createTransport(): { transport: ApiTransport; calls: Array<{ path: string; init: RequestInit }> } {
  const calls: Array<{ path: string; init: RequestInit }> = [];
  const transport: ApiTransport = async (path, init) => {
    calls.push({ path, init });

    if (path === "/v1/me") {
      return {
        id: "buyer-001",
        role: "buyer",
        email: "ruchi@example.com",
        preferredLanguage: "english",
        businessName: "Ruchi Fashion House",
      };
    }

    if (path === "/v1/buyers/preferences/language") {
      return {
        id: "buyer-001",
        role: "buyer",
        email: "ruchi@example.com",
        preferredLanguage: JSON.parse(String(init.body)).preferredLanguage,
      };
    }

    if (path === "/v1/catalog/products") {
      return {
        items: [
          {
            id: "prod-western-001",
            title: "Jeans Top Set",
            category: "western",
            baseWholesalePrice: 310,
            moq: 200,
            availabilityStatus: "in_stock",
            isNewArrival: true,
            coverImageUrl: "https://cdn.example.com/look.jpg",
          },
        ],
      };
    }

    if (path === "/v1/catalog/products/prod-western-001") {
      return {
        id: "prod-western-001",
        title: "Jeans Top Set",
        category: "western",
        baseWholesalePrice: 310,
        moq: 200,
        availabilityStatus: "in_stock",
        isNewArrival: true,
        variants: [{ id: "var-western-001-s", sizeLabel: "S", availabilityStatus: "in_stock" }],
      };
    }

    if (path === "/v1/orders") {
      if (init.method === "POST") {
        return {
          id: "ord-001",
          status: "created",
          totalAmount: 62000,
          items: [{ productVariantId: "var-western-001-s", quantity: 200, unitPrice: 310 }],
        };
      }

      return {
        items: [
          {
            id: "ord-001",
            status: "created",
            totalAmount: 62000,
            items: [{ productVariantId: "var-western-001-s", quantity: 200, unitPrice: 310 }],
          },
        ],
      };
    }

    if (path === "/v1/orders/ord-001") {
      return {
        id: "ord-001",
        status: "created",
        totalAmount: 62000,
        items: [{ productVariantId: "var-western-001-s", quantity: 200, unitPrice: 310 }],
      };
    }

    if (path === "/v1/orders/ord-001/refunds") {
      return {
        items: [{ id: "refund-001", orderId: "ord-001", buyerId: "buyer-001", status: "approved", decisionType: "store_credit" }],
      };
    }

    throw new Error(`unexpected_path_${path}`);
  };

  return { transport, calls };
}

describe("US1 buyer mobile flow", () => {
  it("bootstraps a buyer session and persists language preference", async () => {
    const { transport, calls } = createTransport();
    const sessionStore = createSessionStore({ initialToken: "buyer-token" });
    const api = new BuyerApiClient({ baseUrl: "https://api.example.com", getToken: sessionStore.getToken, transport });
    const languageController = createLanguageController({ api, sessionStore });

    await sessionStore.bootstrap(api);
    assert.equal(sessionStore.getSnapshot().status, "authenticated");
    assert.equal(sessionStore.getSnapshot().user?.businessName, "Ruchi Fashion House");

    const updated = await languageController.selectLanguage("hinglish");
    assert.equal(updated.preferredLanguage, "hinglish" satisfies Language);
    assert.equal(sessionStore.getSnapshot().language, "hinglish");
    assert.equal(calls[1].path, "/v1/buyers/preferences/language");
  });

  it("loads catalog and product detail for the PLP-to-PDP journey", async () => {
    const { transport } = createTransport();
    const analytics = createRecordingAnalytics();
    const sessionStore = createSessionStore({ initialToken: "buyer-token" });
    const api = new BuyerApiClient({ baseUrl: "https://api.example.com", getToken: sessionStore.getToken, transport });
    const catalog = createCatalogController({ api, analytics });

    const products = await catalog.loadProducts();
    assert.equal(products[0].title, "Jeans Top Set");
    assert.equal(products[0].moq, 200);

    const detail = await catalog.loadProductDetail("prod-western-001");
    assert.equal(detail.variants[0].id, "var-western-001-s");
    assert.deepEqual(analytics.events.map((event) => event.name), ["catalog_loaded", "product_detail_opened"]);
  });

  it("submits a valid wholesale order and blocks quantities below MOQ", async () => {
    const { transport } = createTransport();
    const analytics = createRecordingAnalytics();
    const sessionStore = createSessionStore({ initialToken: "buyer-token" });
    const api = new BuyerApiClient({ baseUrl: "https://api.example.com", getToken: sessionStore.getToken, transport });
    const orders = createOrderController({ api, analytics });

    assert.throws(
      () => orders.validateWholesaleQuantity({ quantity: 20, moq: 200 }),
      /quantity_below_moq/,
    );

    const order = await orders.submitOrder({
      productVariantId: "var-western-001-s",
      quantity: 200,
      shippingAddress: { city: "Delhi" },
    });

    assert.equal(order.id, "ord-001");
    assert.equal(order.totalAmount, 62000);
    assert.deepEqual(analytics.events.map((event) => event.name), ["order_quantity_rejected", "order_submitted"]);
  });

});
