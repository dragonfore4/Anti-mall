"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { checkpointById } from "@/data/checkpoints";
import { repo } from "@/lib/storage";

type Result =
  | { kind: "unlocked" | "already"; emoji: string; name: string }
  | { kind: "invalid" }
  | { kind: "error"; msg: string };

/**
 * สแกน QR (payload: rk:cp:<checkpointId> -> ปลดล็อกเหรียญสถานที่)
 * - modal=false (ดีฟอลต์): เต็มจอ ใช้กับหน้า /scan
 * - modal=true: การ์ดกลางจอ + พื้นหลังมืด ใช้กับปุ่มสแกนในหน้าวิ่ง (กดนอกการ์ดปิด)
 */
export default function ScanOverlay({
  onClose,
  modal = false,
}: {
  onClose: () => void;
  modal?: boolean;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const handledRef = useRef(false);
  // คิวให้ teardown ของกล้องรอบก่อนเสร็จก่อนเริ่มรอบใหม่ (กัน 2 instance ชน #qr-reader)
  const teardownRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (result) return;
    handledRef.current = false;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const safeStop = async () => {
      if (!scanner) return;
      try {
        const st = scanner.getState();
        if (st === Html5QrcodeScannerState.SCANNING || st === Html5QrcodeScannerState.PAUSED) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        /* ยังไม่เริ่ม / หยุดไปแล้ว */
      }
    };

    const handle = async (text: string) => {
      if (handledRef.current || cancelled) return;
      handledRef.current = true; // กันยิงซ้ำทุกเฟรม (รวม QR ที่ไม่ใช่ของเรา)
      const m = text.match(/^rk:cp:(.+)$/);
      const checkpoint = m ? checkpointById(m[1]) : undefined;
      if (!m || !checkpoint) {
        if (!cancelled) setResult({ kind: "invalid" });
        return;
      }
      const status = await repo.unlockAchievement(checkpoint.id);
      if (cancelled) return; // ปิด overlay ระหว่างรอ network -> ไม่ setState
      if (status === "error") setResult({ kind: "error", msg: "บันทึกไม่สำเร็จ — เข้าสู่ระบบหรือยัง?" });
      else setResult({ kind: status, emoji: checkpoint.emoji, name: checkpoint.name });
    };

    // serialize: รอกล้องรอบก่อนปิดสนิทก่อน แล้วค่อยเปิดใหม่ (กันสลับกล้อง/StrictMode ชนกัน)
    const prevTeardown = teardownRef.current;
    let resolveTeardown!: () => void;
    teardownRef.current = new Promise<void>((r) => (resolveTeardown = r));

    (async () => {
      await prevTeardown;
      if (cancelled) return;
      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start({ facingMode: facing }, { fps: 10, qrbox: 240 }, handle, () => {});
        if (cancelled) await safeStop(); // ถูกปิดระหว่างเริ่มกล้อง
      } catch (e) {
        if (!cancelled) setCamError(String((e as Error)?.message ?? e));
      }
    })();

    return () => {
      cancelled = true;
      safeStop().finally(() => resolveTeardown());
    };
  }, [result, facing]);

  const scanAgain = () => {
    setResult(null);
    setCamError(null);
  };

  const inner = (
    <>
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-display text-lg">สแกน QR รับเหรียญ</h2>
        <button onClick={onClose} aria-label="ปิด" className="text-2xl text-muted active:scale-90">
          ✕
        </button>
      </header>

      <div
        className={
          modal ? "flex flex-col px-6 py-6" : "flex flex-1 flex-col justify-center px-6 pb-8"
        }
      >
        {!result ? (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
              <div id="qr-reader" className="w-full" />
              {!camError && (
                <button
                  onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                  aria-label="สลับกล้อง"
                  className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur active:scale-95"
                >
                  🔄 {facing === "environment" ? "กล้องหลัง" : "กล้องหน้า"}
                </button>
              )}
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
            <Link
              href="/scan/codes"
              className="mt-3 text-center text-[11px] text-muted underline-offset-4 active:underline"
            >
              ไม่มี QR จริง? เปิดชุด QR สำหรับทดสอบ
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
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
                <div className="font-display text-lg">{result.msg}</div>
              </>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={scanAgain}
                className="rounded-2xl border border-line bg-card px-5 py-3 text-sm font-bold active:scale-95"
              >
                สแกนอีกครั้ง
              </button>
              <Link
                href="/achievements"
                className="rounded-2xl bg-gradient-to-br from-accent to-accent2 px-5 py-3 text-sm font-bold text-card active:scale-95"
              >
                ดูเหรียญทั้งหมด
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (modal) {
    return (
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-app overflow-hidden rounded-2xl border border-line bg-bg"
          onClick={(e) => e.stopPropagation()}
        >
          {inner}
        </div>
      </div>
    );
  }

  return <div className="fixed inset-0 z-[1000] flex flex-col bg-bg">{inner}</div>;
}
