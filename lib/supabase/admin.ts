import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-to-server contexts with no user session
// (e.g. Stripe webhooks) — bypasses RLS, so it must never be used to
// return data directly to a client request.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL or service role key is not set.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
