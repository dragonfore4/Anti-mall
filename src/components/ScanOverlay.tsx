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
 * สแกน QR แบบ fullscreen overlay (ใช้ทั้งหน้า /scan และปุ่มในหน้าวิ่ง)
 * payload ที่รับ: rk:cp:<checkpointId> -> ปลดล็อกเหรียญสถานที่
 */
export default function ScanOverlay({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<Result | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const handledRef = useRef(false);

  useEffect(() => {
    if (result) return;
    handledRef.current = false;
    let scanner: Html5Qrcode | null = null;
    let started = false;
    let stopRequested = false;

    // หยุดกล้องอย่างปลอดภัย — stop() จะ throw ถ้าไม่ได้กำลังสแกนอยู่ จึงต้องเช็ค state ก่อน
    const safeStop = () => {
      if (!scanner) return;
      try {
        const st = scanner.getState();
        if (st === Html5QrcodeScannerState.SCANNING || st === Html5QrcodeScannerState.PAUSED) {
          scanner.stop().then(() => scanner?.clear()).catch(() => {});
        }
      } catch {
        /* ยังไม่เริ่ม / หยุดไปแล้ว */
      }
    };

    const handle = async (text: string) => {
      if (handledRef.current) return;
      const m = text.match(/^rk:cp:(.+)$/);
      const cp = m ? checkpointById(m[1]) : undefined;
      if (!m || !cp) {
        setResult({ kind: "invalid" });
      } else {
        handledRef.current = true;
        const status = await repo.unlockAchievement(cp.id);
        if (status === "error") setResult({ kind: "error", msg: "บันทึกไม่สำเร็จ — เข้าสู่ระบบหรือยัง?" });
        else setResult({ kind: status, emoji: cp.emoji, name: cp.name });
      }
      safeStop();
    };

    // หน่วงเล็กน้อยกัน StrictMode mount/unmount เร็ว ๆ -> ถ้าถูกทิ้งก่อน timer ทำงาน กล้องจะไม่เริ่มเลย
    // (กัน AbortError จาก video.play() ที่ element ถูกถอดกลางคัน)
    const timer = setTimeout(() => {
      scanner = new Html5Qrcode("qr-reader");
      scanner
        .start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, handle, () => {})
        .then(() => {
          started = true;
          if (stopRequested) safeStop();
        })
        .catch((e) => setCamError(String(e?.message ?? e)));
    }, 120);

    return () => {
      stopRequested = true;
      clearTimeout(timer);
      if (started) safeStop();
    };
  }, [result, nonce]);

  const scanAgain = () => {
    setResult(null);
    setCamError(null);
    setNonce((n) => n + 1);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-display text-lg">สแกน QR รับเหรียญ</h2>
        <button onClick={onClose} aria-label="ปิด" className="text-2xl text-muted active:scale-90">
          ✕
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6 pb-8">
        {!result ? (
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
    </div>
  );
}
