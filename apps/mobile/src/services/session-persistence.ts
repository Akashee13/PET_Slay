import * as SecureStore from "expo-secure-store";

const BUYER_TOKEN_KEY = "noira.buyerToken";

export const sessionPersistence = {
  async loadToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BUYER_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(BUYER_TOKEN_KEY, token);
    } catch {
      // best-effort persistence only
    }
  },
  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BUYER_TOKEN_KEY);
    } catch {
      // best-effort persistence only
    }
  },
};
