const adminSupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
};

export function getAdminSupabaseConfig() {
  return adminSupabaseConfig;
}

export function isAdminSupabaseConfigured(): boolean {
  return Boolean(adminSupabaseConfig.url && adminSupabaseConfig.anonKey);
}
