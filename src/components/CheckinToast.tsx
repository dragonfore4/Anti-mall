"use client";

import { useEffect, useRef } from "react";

interface Props {
  data: { name: string; fact: string; points: number; calories: number } | null;
  onClose: () => void;
}

export default function CheckinToast({ data, onClose }: Props) {
  // เก็บ onClose ใน ref กัน timer ถูกรีเซ็ตทุก re-render (ตอนวิ่งจะ render ถี่มาก)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => onCloseRef.current(), 4500);
    return () => clearTimeout(t);
  }, [data]); // ผูกกับ data เท่านั้น -> ตั้ง timer ครั้งเดียวตอนเช็คอินใหม่

  return (
    <div
      className={`absolute left-4 right-4 top-[150px] z-[800] rounded-2xl border border-accent bg-card p-4 shadow-2xl transition-all duration-300 ${
        data
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-5 opacity-0"
      }`}
    >
      {data && (
        <>
          <button
            onClick={() => onCloseRef.current()}
            aria-label="ปิด"
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-muted active:scale-90"
          >
            ✕
          </button>
          <div className="flex items-center gap-1.5 pr-7 text-sm font-extrabold text-accent">
            📍 เช็คอิน: {data.name}
          </div>
          <div className="mt-1.5 text-[12.5px] leading-relaxed">{data.fact}</div>
          <div className="mt-1.5 flex gap-3 text-xs font-bold">
            <span className="text-good">🏆 +{data.points} แต้ม</span>
            {data.calories > 0 && (
              <span className="text-accent2">🔥 +{data.calories} แคล (ช่วงนี้)</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
