import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client ฝั่ง server (route handlers / server components)
 * ผูกกับ cookie ของ request เพื่ออ่าน/รีเฟรช session
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // ใน server component การ set cookie จะ throw — ปล่อยผ่าน (middleware รีเฟรชให้แล้ว)
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* server component context — ข้ามไป */
          }
        },
      },
    },
  );
}
