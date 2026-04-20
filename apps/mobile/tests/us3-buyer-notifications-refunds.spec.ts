import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createNotificationController } from "../src/features/notifications/notification-controller.ts";
import { createRefundController } from "../src/features/refunds/refund-controller.ts";
import { createOrderController } from "../src/features/orders/order-controller.ts";
import { BuyerApiClient, type ApiTransport } from "../src/services/buyer-api.ts";
import { NotificationsService } from "../src/services/notifications.ts";
import { createSessionStore } from "../src/state/session-store.ts";

function createTransport(): ApiTransport {
  return async (path) => {
    if (path === "/v1/orders") {
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
        items: [
          {
            id: "refund-001",
            orderId: "ord-001",
            buyerId: "buyer-001",
            status: "approved",
            decisionType: "store_credit",
            reasonCode: "change_of_mind",
          },
        ],
      };
    }

    throw new Error(`unexpected_path_${path}`);
  };
}

describe("US3 buyer notification and refund visibility", () => {
  it("loads buyer orders and describes store-credit refund decisions", async () => {
    const sessionStore = createSessionStore({ initialToken: "buyer-token" });
    const api = new BuyerApiClient({ baseUrl: "https://api.example.com", getToken: sessionStore.getToken, transport: createTransport() });
    const orders = createOrderController({ api });
    const refunds = createRefundController();

    const history = await orders.loadOrderHistory();
    assert.equal(history[0].id, "ord-001");

    const detail = await orders.loadOrderDetail("ord-001");
    assert.equal(detail.totalAmount, 62000);

    const decisions = await orders.loadRefunds("ord-001");
    assert.equal(refunds.describeDecision(decisions[0]).headline, "Store credit refund");
  });

  it("registers notification readiness and parses order deep links", async () => {
    const service = new NotificationsService("https://api.example.com", async () => ({
      provider: "expo",
      token: "ExponentPushToken[test]",
      platform: "android",
    }));

    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      ({
        ok: true,
        status: 201,
        json: async () => ({ token: "ExponentPushToken[test]" }),
      }) as Response;

    try {
      const notifications = createNotificationController({
        getSessionToken: () => "buyer-token",
        service,
      });

      const readiness = await notifications.getReadiness();
      assert.equal(readiness.ready, true);
      assert.equal(readiness.reason, "ready");
      assert.equal(notifications.buildOrderDeepLink("ord-001"), "/(app)/orders/ord-001");
      assert.deepEqual(notifications.parseDeepLink("petslay://orders/ord-001"), {
        type: "order",
        orderId: "ord-001",
        href: "/(app)/orders/ord-001",
      });
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
