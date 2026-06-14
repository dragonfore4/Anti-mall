"use client";

import { useEffect, useRef, useState } from "react";
import { drawRecapCard, type RecapData } from "@/lib/recapCard";

interface Props {
  data: RecapData;
  onClose: () => void;
}

export default function RecapShareModal({ data, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // draw once on mount
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawRecapCard(canvas, data)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  // detect Web Share (files) support — probe with a tiny dummy file
  useEffect(() => {
    try {
      const probe = new File(["x"], "x.png", { type: "image/png" });
      setCanShareFiles(!!navigator.canShare && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((b) => resolve(b), "image/png");
    });

  const fileName = `recap-${data.routeName}-${data.km}km.png`.replace(/\s+/g, "-");

  const onSave = async () => {
    const blob = await toBlob();
    if (!blob) return setError(true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onShare = async () => {
    const blob = await toBlob();
    if (!blob) return setError(true);
    const file = new File([blob], fileName, { type: "image/png" });
    const text = `🏃 ฉันวิ่ง "${data.routeName}" ${data.km} กม. ได้ ${data.points} แต้ม! #วิ่งรอบเกาะรัตนโกสินทร์`;
    try {
      await navigator.share({ files: [file], text });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/80 p-5 backdrop-blur-sm">
      <div className="card-paper rise flex max-h-[92dvh] w-full max-w-[360px] flex-col rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="kicker text-[11px] text-accent2">การ์ดสรุปผล</div>
          <button onClick={onClose} className="text-xl text-muted active:scale-90" aria-label="ปิด">
            ✕
          </button>
        </div>

        {/* preview: full-res canvas scaled down by CSS */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-line bg-card2">
          <canvas ref={canvasRef} className="h-auto w-full" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">กำลังสร้างรูป…</div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-accent bg-accent/8 p-2.5 text-xs text-accent">
            สร้างรูปไม่สำเร็จ
            <button
              onClick={() => canvasRef.current && drawRecapCard(canvasRef.current, data).then(() => { setError(false); setReady(true); }).catch(() => setError(true))}
              className="font-bold underline underline-offset-2"
            >
              ลองใหม่
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-2.5">
          <button
            onClick={onSave}
            disabled={!ready}
            className="flex-1 rounded-xl border border-line bg-card2 p-3.5 font-bold active:scale-95 disabled:opacity-50"
          >
            ⬇ บันทึกรูป
          </button>
          {canShareFiles && (
            <button
              onClick={onShare}
              disabled={!ready}
              className="flex-1 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold text-card active:scale-95 disabled:opacity-50"
            >
              แชร์
            </button>
          )}
        </div>
        {!canShareFiles && (
          <p className="mt-2 text-center text-[11px] text-muted">บนมือถือ: กดค้างที่รูปเพื่อบันทึก แล้วโพสต์ลง IG Story ได้</p>
        )}
      </div>
    </div>
  );
}
