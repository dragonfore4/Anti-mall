import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client ฝั่ง "แอดมิน" — ใช้ service_role key
 * → bypass RLS อ่าน/เขียนข้ามผู้ใช้ได้ (เช่น dashboard ที่ต้องเห็น profiles ทุกคน)
 *
 * ⚠️ service_role มีสิทธิ์เต็ม ห้ามหลุดไป client เด็ดขาด — ใช้เฉพาะใน server component / route handler:
 * - key อ่านจาก SUPABASE_SERVICE_ROLE_KEY (ไม่มี NEXT_PUBLIC_ prefix → Next ไม่ bundle ไป browser)
 * - ปิด session/refresh: client นี้ไม่ผูกกับ cookie ของ user คนไหน
 */
export const isAdminConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
