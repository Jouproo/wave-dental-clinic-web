import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client (uses service role key — full access, bypasses RLS)
export function supabaseServer() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// Browser/client-side client (uses anon key — public read only)
export function supabaseBrowser() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
