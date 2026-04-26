const mobileSupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://exqerpwhvbeuozcpwpoy.supabase.co",
  anonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWVycHdodmJldW96Y3B3cG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDU5NDYsImV4cCI6MjA5MjE4MTk0Nn0.WU7SZjogpZCJR15kN4Uc-uuj2Ws4H87dhJRgFikPTVc"
};

export function getMobileSupabaseConfig() {
  return mobileSupabaseConfig;
}

export function isMobileSupabaseConfigured(): boolean {
  return Boolean(mobileSupabaseConfig.url && mobileSupabaseConfig.anonKey);
}
