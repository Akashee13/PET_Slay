export type SocialAuthProvider = "google" | "facebook" | "instagram";

export type SocialAuthConfig = {
  supabaseUrl: string;
  redirectTo: string;
};

export type SocialAuthOption = {
  provider: SocialAuthProvider;
  label: string;
  enabled: boolean;
  setupHint?: string;
  url?: string;
};

const PROVIDER_LABELS: Record<SocialAuthProvider, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
  instagram: "Continue with Instagram",
};

export function createSocialAuthOptions(config: SocialAuthConfig): SocialAuthOption[] {
  return (["google", "facebook", "instagram"] satisfies SocialAuthProvider[]).map((provider) => {
    const enabled = Boolean(config.supabaseUrl && config.redirectTo);
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
