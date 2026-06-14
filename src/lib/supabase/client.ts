import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client ฝั่ง browser (client components)
 * อ่าน env NEXT_PUBLIC_* ที่ฝังตอน build
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/** ยังตั้งค่า Supabase หรือยัง (ใช้ซ่อน/แสดงปุ่ม login ก่อน setup) */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
