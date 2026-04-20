"use client";

import { createContext, ReactNode, useContext, useMemo, useSyncExternalStore } from "react";

import { createCatalogController, type CatalogController } from "../features/catalog/catalog-controller";
import { createLanguageController, type LanguageController } from "../features/language/language-controller";
import { createOrderController, type OrderController } from "../features/orders/order-controller";
import { BuyerApiClient } from "../services/buyer-api";
import { createSessionStore, getDefaultBuyerToken, type SessionSnapshot, type SessionStore } from "./session-store";

type BuyerAppContextValue = {
  api: BuyerApiClient;
  catalog: CatalogController;
  language: LanguageController;
  orders: OrderController;
  sessionStore: SessionStore;
};

const BuyerAppContext = createContext<BuyerAppContextValue | null>(null);
const sessionStore = createSessionStore({ initialToken: getDefaultBuyerToken() });
const api = new BuyerApiClient({ getToken: sessionStore.getToken });
const catalog = createCatalogController({ api });
const language = createLanguageController({ api, sessionStore });
const orders = createOrderController({ api });

export function BuyerAppProvider({ children }: { children: ReactNode }) {
  const value = useMemo<BuyerAppContextValue>(
    () => ({
      api,
      catalog,
      language,
      orders,
      sessionStore,
    }),
    [],
  );

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

