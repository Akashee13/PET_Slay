import type { CurrentUser, Language } from "@pet-slay/types";

import type { BuyerApiClient } from "../services/buyer-api";

type SessionStatus = "anonymous" | "authenticating" | "authenticated" | "error";

export type SessionSnapshot = {
  status: SessionStatus;
  token: string | null;
  user: CurrentUser | null;
  language: Language;
  error?: string;
};

export type SessionStore = {
  bootstrap: (api: BuyerApiClient) => Promise<void>;
  getSnapshot: () => SessionSnapshot;
  getToken: () => string | null;
  setLanguage: (language: Language) => void;
  setToken: (token: string) => void;
  signOut: () => void;
  subscribe: (listener: () => void) => () => void;
};

export type SessionStoreOptions = {
  initialToken?: string | null;
};

export function getDefaultBuyerToken(): string {
  if (process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN) {
    return process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN;
  }

  return allowsLocalDevToken() ? "dev-buyer-token" : "";
}

export function getConfiguredBuyerToken(): string {
  return process.env.EXPO_PUBLIC_BUYER_BEARER_TOKEN ?? "";
}

function allowsLocalDevToken(): boolean {
  const profile = process.env.EXPO_PUBLIC_APP_PROFILE ?? process.env.EXPO_PUBLIC_APP_ENV ?? "local";
  return ["dev", "development", "local", "test"].includes(profile.toLowerCase());
}

export function createSessionStore(options?: SessionStoreOptions): SessionStore {
  let snapshot: SessionSnapshot = {
    status: options?.initialToken ? "anonymous" : "anonymous",
    token: options?.initialToken ?? null,
    user: null,
    language: "english",
  };
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  function setSnapshot(nextSnapshot: SessionSnapshot) {
    snapshot = nextSnapshot;
    emit();
  }

  return {
    async bootstrap(api) {
      if (!snapshot.token) {
        setSnapshot({ ...snapshot, status: "anonymous" });
        return;
      }

      setSnapshot({ ...snapshot, status: "authenticating", error: undefined });
      try {
        const user = await api.currentUser();
        setSnapshot({
          status: "authenticated",
          token: snapshot.token,
          user,
          language: user.preferredLanguage,
        });
      } catch (error) {
        setSnapshot({
          ...snapshot,
          status: "error",
          error: error instanceof Error ? error.message : "session_bootstrap_failed",
        });
      }
    },
    getSnapshot() {
      return snapshot;
    },
    getToken() {
      return snapshot.token;
    },
    setLanguage(language) {
      setSnapshot({ ...snapshot, language, user: snapshot.user ? { ...snapshot.user, preferredLanguage: language } : null });
    },
    setToken(token) {
      setSnapshot({ ...snapshot, token, status: "anonymous", error: undefined });
    },
    signOut() {
      setSnapshot({ status: "anonymous", token: null, user: null, language: snapshot.language });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
