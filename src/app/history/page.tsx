"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RunRecord } from "@/types";
import { repo } from "@/lib/storage";
import { fmtTime } from "@/lib/stats";

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  useEffect(() => setRuns(repo.getRuns()), []);

  return (
    <main className="min-h-[100dvh] px-6 pb-12 pt-6">
      <div className="flex items-center justify-between text-[11px]">
        <Link href="/" className="font-display text-accent active:opacity-60">
          ← กลับ
        </Link>
        <span className="kicker text-accent2">๐๔</span>
      </div>

      <h1 className="mt-5 font-display text-[30px] leading-tight">ประวัติการวิ่ง</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        บันทึกทุกครั้งที่ออกวิ่ง — ระยะ เวลา แคลอรี่ และแต้มที่ได้
      </p>
      <div className="rule-double mt-4" />

      {runs.length === 0 ? (
        <div className="mt-24 text-center text-muted">
          <div className="font-display text-5xl text-line">ว่าง</div>
          <div className="mt-3 text-[13px]">ยังไม่มีประวัติ — ออกไปวิ่งกันเลย</div>
          <Link
            href="/routes"
            className="mt-5 inline-block rounded-xl bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-bold text-card active:scale-95"
          >
            เลือกเส้นทาง →
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {runs.map((r, i) => (
            <div
              key={r.id}
              className="card-paper rise rounded-xl p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-[15px]">{r.routeName}</h3>
                <div className="text-[11px] text-muted">
                  {new Date(r.dateISO).toLocaleDateString("th-TH")}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2.5 text-[12px] text-muted">
                <span>
                  <b className="font-display text-ink">{r.km}</b> กม.
                </span>
                <span>
                  <b className="font-display text-ink">{fmtTime(r.elapsedMs)}</b>
                </span>
                <span>
                  <b className="font-display text-ink">{r.calories}</b> แคล
                </span>
                <span>
                  <b className="font-display text-ink">{r.steps.toLocaleString()}</b> ก้าว
                </span>
                <span className="text-accent">
                  <b className="font-display">{r.points}</b> แต้ม
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
