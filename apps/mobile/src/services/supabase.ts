const mobileSupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""
};

export function getMobileSupabaseConfig() {
  return mobileSupabaseConfig;
}

export function isMobileSupabaseConfigured(): boolean {
  return Boolean(mobileSupabaseConfig.url && mobileSupabaseConfig.anonKey);
}
