"use client";

import Link from "next/link";

interface Props {
  km: string;
  time: string;
  cal: number;
  steps: number;
  points: number;
  checkins: number;
  onShare: () => void;
}

export default function SummaryModal({ km, time, cal, steps, points, checkins, onShare }: Props) {
  const grid = [
    { v: km, l: "กิโลเมตร" },
    { v: time, l: "เวลา" },
    { v: String(cal), l: "แคลอรี่" },
    { v: steps.toLocaleString(), l: "ก้าว" },
  ];
  return (
    <div className="absolute inset-0 z-[900] flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm">
      <div className="card-paper rise max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl p-6 text-center">
        <div className="kicker text-[11px] text-accent2">เส้นชัย · ๒๕๖๙</div>
        <h2 className="mt-2 font-display text-2xl leading-tight">วิ่งครบเส้นทางแล้ว</h2>
        <div className="rule-double mx-auto mt-3 w-14" />

        <div className="my-5 grid grid-cols-2 gap-2.5">
          {grid.map((g) => (
            <div key={g.l} className="rounded-xl border border-bg/10 bg-cream p-3.5">
              <div className="font-display text-2xl font-semibold text-bg">{g.v}</div>
              <div className="mt-0.5 text-[11px] tracking-wide text-bg/60">{g.l}</div>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-xl border border-dashed border-accent bg-accent/8 p-3 text-[13px]">
          ได้รับ <b className="font-display text-lg text-accent">{points}</b> แต้ม จาก {checkins}{" "}
          ภารกิจเช็คอิน
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onShare}
            className="flex-1 rounded-xl bg-accent p-3.5 font-bold tracking-wide text-cream active:scale-95"
          >
            แชร์ลง Story
          </button>
          <Link
            href="/"
            className="rounded-xl border border-line bg-card2 px-5 py-3.5 font-bold active:scale-95"
          >
            เสร็จ
          </Link>
        </div>
      </div>
    </div>
  );
}
