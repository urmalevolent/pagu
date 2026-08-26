// src/lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fungsi ini digunakan agar Next.js aman memanggil Supabase dari sisi browser
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
