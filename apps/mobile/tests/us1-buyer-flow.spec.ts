import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Language } from "@pet-slay/types";

import { BuyerApiClient, type ApiTransport } from "../src/services/buyer-api.ts";
import { createCatalogController } from "../src/features/catalog/catalog-controller.ts";
import { FALLBACK_PRODUCT_IMAGE, getProductImageUrls } from "../src/features/catalog/product-images.ts";
import { createLanguageController } from "../src/features/language/language-controller.ts";
import { createOrderController } from "../src/features/orders/order-controller.ts";
import { formatInr, formatOrderStatus } from "../src/features/orders/order-presenter.ts";
import { buildWhatsappOrderUrl } from "../src/features/orders/whatsapp-order.ts";
import { buildSupabaseOAuthUrl, createSocialAuthOptions, extractBearerTokenFromCallback } from "../src/features/auth/social-auth-controller.ts";
import { createRecordingAnalytics } from "../src/services/analytics.ts";
import { createSessionStore, getConfiguredBuyerToken, getDefaultBuyerToken } from "../src/state/session-store.ts";
import { translationResources } from "../../../packages/design-tokens/src/i18n/resources.ts";

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
  it("only falls back to the dev buyer token in local-like profiles", () => {
    const originalProfile = process.env.EXPO_PUBLIC_APP_PROFILE;
    const originalEnv = process.env.EXPO_PUBLIC_APP_ENV;
    const originalToken = process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN;

    try {
      delete process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN;
      process.env.EXPO_PUBLIC_APP_PROFILE = "local";
      assert.equal(getDefaultBuyerToken(), "dev-buyer-token");
      assert.equal(getConfiguredBuyerToken(), "");

      process.env.EXPO_PUBLIC_APP_PROFILE = "stage";
      assert.equal(getDefaultBuyerToken(), "");

      process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN = "stage-buyer-token";
      assert.equal(getDefaultBuyerToken(), "stage-buyer-token");
      assert.equal(getConfiguredBuyerToken(), "stage-buyer-token");
    } finally {
      restoreEnv("EXPO_PUBLIC_APP_PROFILE", originalProfile);
      restoreEnv("EXPO_PUBLIC_APP_ENV", originalEnv);
      restoreEnv("EXPO_PUBLIC_BUYER_BEARER_TOKEN", originalToken);
    }
  });

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

    sessionStore.signOut();
    assert.equal(sessionStore.getSnapshot().status, "anonymous");
    assert.equal(sessionStore.getSnapshot().token, null);
    assert.equal(sessionStore.getSnapshot().language, "hinglish");
  });

  it("prepares provider-ready social auth options without enabling unfinished OAuth", () => {
    const pendingOptions = createSocialAuthOptions({ supabaseUrl: "", redirectTo: "petslay://auth/callback", googleEnabled: false });
    assert.equal(pendingOptions.every((option) => !option.enabled), true);
    assert.equal(pendingOptions[0].setupHint, "Supabase OAuth setup pending");

    const googleUrl = buildSupabaseOAuthUrl("google", {
      supabaseUrl: "https://stage.supabase.co/",
      redirectTo: "petslay://auth/callback",
    });
    const readyOptions = createSocialAuthOptions({
      supabaseUrl: "https://stage.supabase.co/",
      redirectTo: "petslay://auth/callback",
      googleEnabled: true,
    });
    assert.equal(readyOptions[0].provider, "google");
    assert.equal(readyOptions[0].enabled, true);
    assert.equal(readyOptions[1].enabled, false);
    assert.equal(readyOptions[2].enabled, false);
    assert.equal(googleUrl, "https://stage.supabase.co/auth/v1/authorize?provider=google&redirect_to=petslay%3A%2F%2Fauth%2Fcallback");
    assert.equal(extractBearerTokenFromCallback("petslay://auth/callback#access_token=buyer-oauth-token"), "buyer-oauth-token");
    assert.equal(extractBearerTokenFromCallback({ access_token: "buyer-param-token" }), "buyer-param-token");
  });

  it("loads catalog and product detail for the PLP-to-PDP journey", async () => {
    const { transport, calls } = createTransport();
    const analytics = createRecordingAnalytics();
    const sessionStore = createSessionStore({ initialToken: "buyer-token" });
    const api = new BuyerApiClient({ baseUrl: "https://api.example.com", getToken: sessionStore.getToken, transport });
    const catalog = createCatalogController({ api, analytics });

    const products = await catalog.loadProducts({ language: "hinglish" });
    assert.equal(products[0].title, "Jeans Top Set");
    assert.equal(products[0].moq, 200);
    assert.equal(calls.find((call) => call.path === "/v1/catalog/products")?.init.headers?.["Accept-Language"], "hinglish");

    const detail = await catalog.loadProductDetail("prod-western-001", { language: "hindi" });
    assert.equal(detail.variants[0].id, "var-western-001-s");
    assert.equal(calls.find((call) => call.path === "/v1/catalog/products/prod-western-001")?.init.headers?.["Accept-Language"], "hindi");
    assert.deepEqual(analytics.events.map((event) => event.name), ["catalog_loaded", "product_detail_opened"]);
  });

  it("normalizes product images so empty or duplicate URLs do not break the catalog", () => {
    assert.deepEqual(
      getProductImageUrls({
        id: "prod-001",
        title: "Kurti set",
        category: "south_asian",
        baseWholesalePrice: 280,
        moq: 150,
        availabilityStatus: "in_stock",
        isNewArrival: false,
        coverImageUrl: " https://cdn.example.com/look-1.jpg ",
        imageUrls: ["https://cdn.example.com/look-1.jpg", "", "https://cdn.example.com/look-2.jpg"],
      }),
      ["https://cdn.example.com/look-1.jpg", "https://cdn.example.com/look-2.jpg"],
    );

    assert.deepEqual(
      getProductImageUrls({
        id: "prod-002",
        title: "Top",
        category: "western",
        baseWholesalePrice: 220,
        moq: 100,
        availabilityStatus: "in_stock",
        isNewArrival: true,
      }),
      [FALLBACK_PRODUCT_IMAGE],
    );
  });

  it("has buyer operations copy for English, Hindi, and Hinglish", () => {
    assert.equal(translationResources.english.viewOrderRefundStatus, "View order and refund status");
    assert.equal(translationResources.hindi.placeWholesaleOrder, "होलसेल ऑर्डर करें");
    assert.equal(translationResources.hinglish.arrivalAlertsBody, "Sirf relevant new-arrival prompts milenge jab device notifications ready honge.");
    assert.equal(translationResources.hindi.authTitle, "नोइरा के साथ तेज़ रीस्टॉक करें");
    assert.equal(translationResources.hinglish.startWholesaleOrder, "Wholesale order start karo");
    assert.equal(translationResources.english.whatsappOrderingTitle, "Order on WhatsApp for now");
    assert.equal(translationResources.english.socialGoogleUnavailable, "Gmail sign-in will appear here as soon as it is enabled for this app.");
    assert.equal(translationResources.hindi.languageHindiLabel, "हिन्दी");
    assert.equal(translationResources.english.missingCallbackToken, "Sign-in callback did not include a buyer token. Please try again.");
  });

  it("formats order status and totals for buyer-facing screens", () => {
    assert.equal(formatOrderStatus("payment_pending"), "Payment Pending");
    assert.equal(formatInr(62000), "₹62,000");
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

  it("builds a WhatsApp draft with buyer, quantity, city, and image context", () => {
    const url = buildWhatsappOrderUrl({
      businessName: "Ruchi Fashion House",
      productTitle: "Jeans Top Set",
      productImageUrl: "https://cdn.example.com/look.jpg",
      quantity: 250,
      moq: 200,
      city: "Delhi",
      unitPrice: 310,
    });

    assert.match(url, /^https:\/\/wa\.me\/918292349038\?text=/);
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");
    assert.match(decoded, /Buyer: Ruchi Fashion House/);
    assert.match(decoded, /Required quantity: 250/);
    assert.match(decoded, /Delivery city: Delhi/);
    assert.match(decoded, /Product image: https:\/\/cdn\.example\.com\/look\.jpg/);
  });

});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
