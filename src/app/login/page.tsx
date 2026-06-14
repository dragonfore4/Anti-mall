"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const hadError = params.get("error");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-8 text-center">
      <div>
        <div className="kicker text-[11px] text-accent2">รัตนโกสินทร์</div>
        <h1 className="mt-3 font-display text-3xl leading-tight">เข้าสู่ระบบ</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          เข้าสู่ระบบเพื่อบันทึกการวิ่ง สะสมแต้ม
          <br />
          และเก็บเหรียญสถานที่จากการสแกน QR
        </p>
      </div>

      {hadError && (
        <p className="text-xs text-accent">เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      )}

      {isSupabaseConfigured ? (
        <button
          onClick={signIn}
          disabled={busy}
          className="flex items-center gap-3 rounded-2xl border border-line bg-card px-6 py-3.5 font-bold active:scale-95 disabled:opacity-60"
        >
          <span className="text-lg">🇬</span>
          {busy ? "กำลังพาไป Google…" : "เข้าสู่ระบบด้วย Google"}
        </button>
      ) : (
        <p className="max-w-[34ch] rounded-xl border border-line bg-card2 p-4 text-xs leading-relaxed text-muted">
          ยังไม่ได้ตั้งค่า Supabase — ดูวิธีตั้งที่ <code>docs/SUPABASE_SETUP.md</code> แล้วใส่ key ใน{" "}
          <code>.env.local</code>
        </p>
      )}

      <Link href="/" className="text-xs text-muted underline-offset-4 active:underline">
        ← กลับหน้าแรก
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
