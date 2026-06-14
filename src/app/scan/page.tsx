"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { checkpointById } from "@/data/checkpoints";
import { repo } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";

type Result =
  | { kind: "unlocked" | "already"; emoji: string; name: string }
  | { kind: "invalid" }
  | { kind: "error"; msg: string };

export default function ScanPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const needLogin = isSupabaseConfigured && !loading && !user;

  const [result, setResult] = useState<Result | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0); // ใช้รีสตาร์ทกล้องตอน "สแกนอีกครั้ง"
  const handledRef = useRef(false);

  // ยังไม่ login (โหมด Supabase) -> เด้งไป login
  useEffect(() => {
    if (needLogin) router.replace(`/login?next=${encodeURIComponent("/scan")}`);
  }, [needLogin, router]);

  // เปิดกล้องสแกน
  useEffect(() => {
    if (needLogin || loading || result) return;
    handledRef.current = false;
    const scanner = new Html5Qrcode("qr-reader");
    let stopped = false;

    const handle = async (text: string) => {
      if (handledRef.current) return;
      const m = text.match(/^rk:cp:(.+)$/);
      const cp = m ? checkpointById(m[1]) : undefined;
      if (!m || !cp) {
        setResult({ kind: "invalid" });
      } else {
        handledRef.current = true;
        const status = await repo.unlockAchievement(cp.id);
        if (status === "error") setResult({ kind: "error", msg: "บันทึกไม่สำเร็จ" });
        else setResult({ kind: status, emoji: cp.emoji, name: cp.name });
      }
      if (!stopped) {
        stopped = true;
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };

    scanner
      .start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, handle, () => {})
      .catch((e) => setCamError(String(e?.message ?? e)));

    return () => {
      if (!stopped) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [needLogin, loading, result, nonce]);

  const scanAgain = () => {
    setResult(null);
    setCamError(null);
    setNonce((n) => n + 1);
  };

  if (needLogin || loading) {
    return <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>;
  }

  return (
    <main className="flex min-h-[100dvh] flex-col px-6 pb-12 pt-6">
      <header className="flex items-center gap-3 pb-4">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <h1 className="font-display text-xl">สแกน QR รับเหรียญ</h1>
      </header>

      {!result && (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <div id="qr-reader" className="w-full" />
          </div>
          {camError ? (
            <p className="mt-4 rounded-xl border border-line bg-card2 p-4 text-xs leading-relaxed text-muted">
              เปิดกล้องไม่ได้: {camError}
              <br />
              บนมือถือต้องเปิดผ่าน HTTPS (เช่น cloudflared) และอนุญาตให้ใช้กล้อง
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-muted">เล็ง QR ที่จุดมรดกให้อยู่ในกรอบ</p>
          )}
          <Link href="/scan/codes" className="mt-3 text-center text-[11px] text-muted underline-offset-4 active:underline">
            ไม่มี QR จริง? เปิดชุด QR สำหรับทดสอบ
          </Link>
        </>
      )}

      {result && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          {result.kind === "unlocked" && (
            <>
              <div className="text-7xl">{result.emoji}</div>
              <div className="font-display text-2xl text-accent">ปลดล็อกเหรียญ!</div>
              <div className="text-sm">{result.name}</div>
            </>
          )}
          {result.kind === "already" && (
            <>
              <div className="text-7xl opacity-70">{result.emoji}</div>
              <div className="font-display text-xl">มีเหรียญนี้แล้ว</div>
              <div className="text-sm text-muted">{result.name}</div>
            </>
          )}
          {result.kind === "invalid" && (
            <>
              <div className="text-7xl">🤔</div>
              <div className="font-display text-xl">QR นี้ไม่ใช่จุดมรดก</div>
            </>
          )}
          {result.kind === "error" && (
            <>
              <div className="text-7xl">⚠️</div>
              <div className="font-display text-xl">{result.msg}</div>
            </>
          )}

          <div className="mt-4 flex gap-3">
            <button onClick={scanAgain} className="rounded-2xl border border-line bg-card px-5 py-3 text-sm font-bold active:scale-95">
              สแกนอีกครั้ง
            </button>
            <Link href="/achievements" className="rounded-2xl bg-gradient-to-br from-accent to-accent2 px-5 py-3 text-sm font-bold text-card active:scale-95">
              ดูเหรียญทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
