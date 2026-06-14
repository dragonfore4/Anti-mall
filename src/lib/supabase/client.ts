import { createBrowserClient } from "@supabase/ssr";

// แยกเป็น wrapper เพื่อให้ TS อนุมาน type ของ client จาก "การเรียกจริง"
// (อนุมานจาก ReturnType<typeof createBrowserClient> ตรง ๆ จะได้ type เพี้ยน -> getUser() เป็น any)
function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let cached: ReturnType<typeof makeClient> | null = null;

/**
 * Supabase client ฝั่ง browser (client components)
 * memoize เป็น singleton ต่อ tab — กัน "Multiple GoTrueClient instances detected"
 * และ token-refresh แย่งกันเขียน cookie
 */
export function createClient() {
  if (!cached) cached = makeClient();
  return cached;
}

/** ยังตั้งค่า Supabase หรือยัง (ใช้ซ่อน/แสดงปุ่ม login ก่อน setup) */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
