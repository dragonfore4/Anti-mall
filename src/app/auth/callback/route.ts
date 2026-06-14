import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * ปลายทาง OAuth ของ Google — แลก code เป็น session
 * แล้วเช็คว่าโปรไฟล์ครบไหม: ยังไม่ครบ -> /onboarding, ครบแล้ว -> next
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=nocode`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange`);
  }

  // โปรไฟล์ครบ (มีวันเกิด) หรือยัง
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("dob")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.dob) {
      return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
