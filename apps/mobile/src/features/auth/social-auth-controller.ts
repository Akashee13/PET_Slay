export type SocialAuthProvider = "google" | "facebook" | "instagram";

export type SocialAuthConfig = {
  supabaseUrl: string;
  redirectTo: string;
  googleEnabled: boolean;
};

export type SocialAuthOption = {
  provider: SocialAuthProvider;
  label: string;
  enabled: boolean;
  setupHint?: string;
  url?: string;
};

const PROVIDER_LABELS: Record<SocialAuthProvider, string> = {
  google: "Continue with Gmail",
  facebook: "Continue with Facebook",
  instagram: "Continue with Instagram",
};

export function createSocialAuthOptions(config: SocialAuthConfig): SocialAuthOption[] {
  return (["google", "facebook", "instagram"] satisfies SocialAuthProvider[]).map((provider) => {
    const enabled = provider === "google" && Boolean(config.googleEnabled && config.supabaseUrl && config.redirectTo);
    return {
      provider,
      label: PROVIDER_LABELS[provider],
      enabled,
      setupHint: enabled ? undefined : "Supabase OAuth setup pending",
      url: enabled ? buildSupabaseOAuthUrl(provider, config) : undefined,
    };
  });
}

export function buildSupabaseOAuthUrl(provider: SocialAuthProvider, config: SocialAuthConfig): string {
  const baseUrl = config.supabaseUrl.replace(/\/$/, "");
  return `${baseUrl}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(config.redirectTo)}`;
}

export async function fetchSocialProviderStatus(input: { supabaseUrl: string; anonKey: string }): Promise<{ googleEnabled: boolean }> {
  if (!input.supabaseUrl || !input.anonKey) {
    return { googleEnabled: false };
  }

  const response = await fetch(`${input.supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: {
      apikey: input.anonKey,
    },
  });
  if (!response.ok) {
    return { googleEnabled: false };
  }

  const payload = (await response.json()) as { external?: Record<string, boolean> };
  return {
    googleEnabled: payload.external?.google === true,
  };
}

export function extractBearerTokenFromCallback(input: string | Record<string, string | string[] | undefined>): string | null {
  if (typeof input !== "string") {
    const token = input.access_token ?? input.token;
    return Array.isArray(token) ? token[0] ?? null : token ?? null;
  }

  const normalized = input.replace("#", "?");
  const queryStart = normalized.indexOf("?");
  if (queryStart === -1) {
    return null;
  }

  const params = normalized
    .slice(queryStart + 1)
    .split("&")
    .map((pair) => pair.split("="))
    .reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (key) {
        accumulator[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
      }
      return accumulator;
    }, {});

  return params.access_token ?? params.token ?? null;
}
