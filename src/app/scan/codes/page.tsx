"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CHECKPOINTS } from "@/data/checkpoints";

/** หน้า dev: สร้าง QR ของทุกจุดไว้ทดสอบสแกน (payload = rk:cp:<id>) */
export default function ScanCodesPage() {
  const [imgs, setImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all(
      CHECKPOINTS.map((c) =>
        QRCode.toDataURL(`rk:cp:${c.id}`, { width: 220, margin: 1 }).then(
          (url) => [c.id, url] as const,
        ),
      ),
    ).then((entries) => setImgs(Object.fromEntries(entries)));
  }, []);

  return (
    <main className="min-h-[100dvh] px-6 pb-12 pt-6">
      <header className="flex items-center gap-3 pb-2">
        <Link href="/scan" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <h1 className="font-display text-xl">QR ทดสอบ</h1>
      </header>
      <p className="mb-5 text-xs leading-relaxed text-muted">
        เปิดหน้านี้บนอีกเครื่อง/อีกแท็บ แล้วใช้หน้า <code>/scan</code> ส่องเพื่อทดสอบปลดล็อกเหรียญ
      </p>

      <div className="grid grid-cols-2 gap-4">
        {CHECKPOINTS.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-white p-3 text-center">
            {imgs[c.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgs[c.id]} alt={c.name} className="mx-auto h-auto w-full" />
            ) : (
              <div className="aspect-square animate-pulse rounded bg-card2" />
            )}
            <div className="mt-2 font-display text-[12px] leading-tight text-ink">
              {c.emoji} {c.name}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
