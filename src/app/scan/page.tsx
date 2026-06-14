"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ScanOverlay from "@/components/ScanOverlay";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";

export default function ScanPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const needLogin = isSupabaseConfigured && !loading && !user;

  useEffect(() => {
    if (needLogin) router.replace(`/login?next=${encodeURIComponent("/scan")}`);
  }, [needLogin, router]);

  if (loading || needLogin) {
    return <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>;
  }

  return <ScanOverlay onClose={() => router.push("/")} />;
}
