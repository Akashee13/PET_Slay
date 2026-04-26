"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { createCatalogController, type CatalogController } from "../features/catalog/catalog-controller";
import { createLanguageController, type LanguageController } from "../features/language/language-controller";
import { createNotificationController, type NotificationController } from "../features/notifications/notification-controller";
import { createOrderController, type OrderController } from "../features/orders/order-controller";
import { createRefundController, type RefundController } from "../features/refunds/refund-controller";
import { createConsoleAnalytics, type Analytics } from "../services/analytics";
import { BuyerApiClient } from "../services/buyer-api";
import { NotificationsService } from "../services/notifications";
import { sessionPersistence } from "../services/session-persistence";
import { createSessionStore, getConfiguredBuyerToken, type SessionSnapshot, type SessionStore } from "./session-store";

type BuyerAppContextValue = {
  api: BuyerApiClient;
  catalog: CatalogController;
  language: LanguageController;
  notifications: NotificationController;
  orders: OrderController;
  refunds: RefundController;
  analytics: Analytics;
  sessionStore: SessionStore;
};

const BuyerAppContext = createContext<BuyerAppContextValue | null>(null);
const sessionStore = createSessionStore({
  initialToken: getConfiguredBuyerToken() || null,
  persistence: sessionPersistence,
});
const api = new BuyerApiClient({ getToken: sessionStore.getToken });
const analytics = createConsoleAnalytics();
const catalog = createCatalogController({ api, analytics });
const language = createLanguageController({ api, sessionStore });
const notificationService = new NotificationsService(process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pet-slay-api-stage-j67sekma7a-el.a.run.app", async () => null);
const notifications = createNotificationController({ getSessionToken: sessionStore.getToken, service: notificationService });
const orders = createOrderController({ api, analytics });
const refunds = createRefundController();

export function BuyerAppProvider({ children }: { children: ReactNode }) {
  const value = useMemo<BuyerAppContextValue>(
    () => ({
      api,
      catalog,
      language,
      notifications,
      orders,
      refunds,
      analytics,
      sessionStore,
    }),
    [],
  );

  useEffect(() => {
    void sessionStore.hydrate(api);
  }, []);

  return <BuyerAppContext.Provider value={value}>{children}</BuyerAppContext.Provider>;
}

export function useBuyerApp(): BuyerAppContextValue {
  const context = useContext(BuyerAppContext);
  if (!context) {
    throw new Error("useBuyerApp must be used inside BuyerAppProvider");
  }
  return context;
}

export function useSessionSnapshot(): SessionSnapshot {
  const { sessionStore: store } = useBuyerApp();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
