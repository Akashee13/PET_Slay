import type { BuyerNotificationReadiness } from "../../services/notifications";

export type NotificationRegistrationService = {
  getBuyerNotificationReadiness: (sessionToken: string) => Promise<BuyerNotificationReadiness>;
};

export type NotificationDeepLink =
  | {
      type: "order";
      orderId: string;
      href: `/(app)/orders/${string}`;
    }
  | {
      type: "catalog";
      href: "/(app)";
    };

export function buildOrderDeepLink(orderId: string): `/(app)/orders/${string}` {
  return `/(app)/orders/${encodeURIComponent(orderId)}`;
}

export function parseNotificationDeepLink(url: string): NotificationDeepLink {
  const normalized = url.trim();
  const orderMatch = normalized.match(/(?:petslay:\/\/orders\/|\/orders\/)([^/?#]+)/);
  if (orderMatch?.[1]) {
    const orderId = decodeURIComponent(orderMatch[1]);
    return {
      type: "order",
      orderId,
      href: buildOrderDeepLink(orderId),
    };
  }

  return {
    type: "catalog",
    href: "/(app)",
  };
}

export type NotificationController = {
  buildOrderDeepLink: typeof buildOrderDeepLink;
  getReadiness: () => Promise<BuyerNotificationReadiness>;
  parseDeepLink: typeof parseNotificationDeepLink;
};

export function createNotificationController(options: {
  getSessionToken: () => string | null;
  service?: NotificationRegistrationService;
}): NotificationController {
  const service =
    options.service ??
    ({
      async getBuyerNotificationReadiness() {
        return { ready: false, reason: "token_unavailable" };
      },
    } satisfies NotificationRegistrationService);

  return {
    buildOrderDeepLink,
    async getReadiness() {
      const sessionToken = options.getSessionToken();
      if (!sessionToken) {
        return { ready: false, reason: "token_unavailable" };
      }

      return service.getBuyerNotificationReadiness(sessionToken);
    },
    parseDeepLink: parseNotificationDeepLink,
  };
}
