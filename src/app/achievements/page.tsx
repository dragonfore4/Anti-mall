"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHECKPOINTS } from "@/data/checkpoints";
import { repo } from "@/lib/storage";

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  useEffect(() => {
    repo.getAchievements().then(setUnlocked);
  }, []);

  const done = unlocked.length;
  const total = CHECKPOINTS.length;

  return (
    <main className="min-h-[100dvh] px-6 pb-12 pt-6">
      <header className="flex items-center gap-3 pb-4">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <h1 className="font-display text-xl">เหรียญสถานที่</h1>
      </header>

      <div className="rounded-2xl border border-line bg-gradient-to-br from-card to-card2 p-6 text-center">
        <div className="text-xs text-muted">สแกน QR ตามจุดมรดกเพื่อสะสมเหรียญ</div>
        <div className="mt-1 font-display text-4xl text-accent">
          {done}
          <span className="text-xl text-muted"> / {total}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {CHECKPOINTS.map((c) => {
          const got = unlocked.includes(c.id);
          return (
            <div
              key={c.id}
              className={`rounded-xl border p-3 text-center ${
                got ? "border-accent bg-accent/10" : "border-line bg-card2 opacity-60"
              }`}
            >
              <div className="text-3xl">{got ? c.emoji : "🔒"}</div>
              <div className="mt-1 font-display text-[11.5px] leading-tight">{c.name}</div>
              <div className="text-[10px] text-muted">{got ? "ปลดล็อกแล้ว" : "ยังไม่สแกน"}</div>
            </div>
          );
        })}
      </div>

      <Link
        href="/scan"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold text-card active:scale-[0.98]"
      >
        📷 สแกน QR รับเหรียญ
      </Link>
    </main>
  );
}
