"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";

/** ปุ่มสถานะผู้ใช้บน masthead: ยังไม่ login -> ลิงก์เข้าสู่ระบบ, login แล้ว -> ชื่อ + ออกจากระบบ */
export default function AuthButton() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (!isSupabaseConfigured || loading) return null;

  if (!user) {
    return (
      <Link href="/login" className="text-[11px] font-bold text-accent active:opacity-70">
        เข้าสู่ระบบ →
      </Link>
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "ผู้ใช้";

  const signOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted">สวัสดี {name}</span>
      <button onClick={signOut} className="font-bold text-accent active:opacity-70">
        ออก
      </button>
    </div>
  );
}
