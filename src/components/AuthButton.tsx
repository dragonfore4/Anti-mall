"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";

/** ปุ่มสถานะผู้ใช้บน masthead: ยังไม่ login -> ลิงก์เข้าสู่ระบบ, login แล้ว -> ชื่อ + ออกจากระบบ */
export default function AuthButton() {
  const { user, loading } = useUser();
  const router = useRouter();

  // ชื่อที่ผู้ใช้ตั้งเองในหน้า /profile (ตาราง profiles) — ใช้เป็นชื่อหลักที่แสดง
  const [firstName, setFirstName] = useState("");
  useEffect(() => {
    if (!user) {
      setFirstName("");
      return;
    }
    let cancelled = false;
    createClient()
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setFirstName(data?.first_name ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isSupabaseConfigured || loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-accent2 px-3.5 py-1.5 text-[11px] font-bold text-bg active:opacity-80"
      >
        เข้าสู่ระบบ →
      </Link>
    );
  }

  const name =
    firstName ||
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "ผู้ใช้";

  const signOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Link href="/profile" className="text-muted active:opacity-70">
        สวัสดี <span className="font-bold underline text-accent2">{name}</span>
      </Link>
      <button
        onClick={signOut}
        className="font-bold text-accent active:opacity-70"
      >
        ออก
      </button>
    </div>
  );
}
