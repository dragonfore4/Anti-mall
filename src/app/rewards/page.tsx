"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repo } from "@/lib/storage";
import { COLLECTIBLES } from "@/data/rewards";

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  useEffect(() => {
    repo.totalPoints().then(setPoints);
  }, []);

  const unlocked = COLLECTIBLES.filter((c) => points >= c.needPoints);
  const next = COLLECTIBLES.find((c) => points < c.needPoints);

  return (
    <main className="min-h-[100dvh] px-6 pb-12 pt-6">
      <div className="flex items-center justify-between text-[11px]">
        <Link href="/" className="font-display text-accent active:opacity-60">
          ← กลับ
        </Link>
        <span className="kicker text-accent2">๐๓</span>
      </div>

      <h1 className="mt-5 font-display text-[30px] leading-tight">แต้ม &amp; รางวัล</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        สะสมแต้มจากภารกิจเช็คอิน แลกกราฟิกมรดกน่าสะสม
      </p>
      <div className="rule-double mt-4" />

      {/* แต้มรวม */}
      <div className="card-paper mt-6 rounded-2xl p-6 text-center">
        <div className="kicker text-[11px] text-accent2">แต้มสะสมทั้งหมด</div>
        <div className="mt-2 font-display text-5xl text-accent">{points}</div>
        {next && (
          <div className="mt-3 text-[12.5px] text-muted">
            อีก <b className="font-display text-ink">{next.needPoints - points}</b> แต้ม จะปลดล็อก{" "}
            {next.emoji} {next.name}
          </div>
        )}
      </div>

      {/* กราฟิกสะสม */}
      <div className="mb-3 mt-7 flex items-baseline justify-between">
        <h2 className="font-display text-lg">กราฟิกสะสม</h2>
        <span className="text-[12px] text-muted">
          {unlocked.length}/{COLLECTIBLES.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {COLLECTIBLES.map((c) => {
          const got = points >= c.needPoints;
          return (
            <div
              key={c.id}
              className={`relative rounded-xl border p-3 text-center ${
                got ? "border-accent bg-accent/10" : "border-line bg-card2 opacity-60"
              }`}
            >
              <span className="absolute left-2 top-1.5 font-display text-[10px] text-accent2">
                {c.code}
              </span>
              <div className="mt-1.5 text-3xl">{got ? c.emoji : "🔒"}</div>
              <div className="mt-1 font-display text-[12px] leading-tight">{c.name}</div>
              <div className="text-[9.5px] leading-tight text-muted">{c.tag}</div>
              <div className="mt-0.5 text-[10px] font-semibold text-accent">
                {got ? "ปลดล็อกแล้ว" : `${c.needPoints} แต้ม`}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
