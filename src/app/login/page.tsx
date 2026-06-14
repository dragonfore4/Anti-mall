"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/** โลโก้ Google ตัวจริง (4 สี) */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-8 text-center">
      <div className="rise">
        <div className="text-5xl">⭐</div>
        <div className="kicker mt-4 text-[11px] text-accent2">รัตนโกสินทร์</div>
        <h1 className="mt-2 font-display text-3xl leading-tight">เข้าสู่ระบบ</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          บันทึกการวิ่ง สะสมแต้ม
          <br />
          และสแกน QR ตามจุดมรดก
        </p>
      </div>

      {hadError && <p className="text-xs text-accent">เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง</p>}

      {isSupabaseConfigured ? (
        <button
          onClick={signIn}
          disabled={busy}
          className="rise flex w-full max-w-[300px] items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3.5 font-semibold text-[#3c4043] shadow-[0_2px_10px_rgba(120,100,70,0.15)] transition hover:shadow-[0_4px_16px_rgba(120,100,70,0.22)] active:scale-[0.97] disabled:opacity-60"
          style={{ animationDelay: "120ms" }}
        >
          {busy ? (
            <span className="text-sm text-muted">กำลังพาไป Google…</span>
          ) : (
            <>
              <GoogleLogo />
              <span>เข้าสู่ระบบด้วย Google</span>
            </>
          )}
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
