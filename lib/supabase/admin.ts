import { createClient } from "@supabase/supabase-js";

// Service-role client — server-side only. Bypasses RLS.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role",
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
