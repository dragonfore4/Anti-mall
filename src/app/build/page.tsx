"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALL_DISTRICTS, ALL_HERITAGE, CHECKPOINTS } from "@/data/checkpoints";
import { ATMOSPHERES } from "@/data/options";
import { generateAdvanceRoute } from "@/lib/routeGen";
import { repo } from "@/lib/storage";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition active:scale-95 ${
        active
          ? "border-accent bg-accent font-semibold text-card"
          : "border-line bg-card text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StepLabel({ no, title, hint }: { no: string; title: string; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2.5">
      <span className="font-display text-xl text-accent">{no}</span>
      <span className="font-display text-base">{title}</span>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

export default function BuildPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<string[]>([]);
  const [heritage, setHeritage] = useState<string[]>([]);
  const [atmosphere, setAtmosphere] = useState<string>(ATMOSPHERES[1].id);
  const [error, setError] = useState<string>("");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // นับจำนวนจุดที่จะได้จากตัวเลือกปัจจุบัน (พรีวิว)
  const matchCount = useMemo(() => {
    let pool = CHECKPOINTS.filter((c) => districts.includes(c.district));
    if (heritage.length) {
      const w = pool.filter((c) => heritage.includes(c.heritage));
      if (w.length >= 2) pool = w;
    }
    return pool.length;
  }, [districts, heritage]);

  const onCreate = () => {
    const route = generateAdvanceRoute({ districts, heritage, atmosphere });
    if (!route) {
      setError("เลือกย่านให้ได้อย่างน้อย 2 จุดเช็คอินก่อนนะครับ");
      return;
    }
    repo.saveDraftRoute(route);
    router.push(`/run/${route.id}`);
  };

  return (
    <main className="min-h-[100dvh] px-6 pb-32 pt-6">
      <div className="flex items-center justify-between text-[11px]">
        <Link href="/" className="font-display text-accent active:opacity-60">
          ← กลับ
        </Link>
        <span className="kicker text-accent2">๐๒</span>
      </div>

      <h1 className="mt-5 font-display text-[30px] leading-tight">ออกแบบเส้นทางเอง</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        ร้อยเส้นทางของคุณเองจากย่าน มรดก และบรรยากาศที่ชอบ
      </p>
      <div className="rule-double mt-4" />

      {/* ๑ ย่าน */}
      <section className="mt-7">
        <StepLabel no="๑" title="เลือกย่าน" hint={`(${districts.length})`} />
        <div className="flex flex-wrap gap-2">
          {ALL_DISTRICTS.map((d) => (
            <Chip key={d} active={districts.includes(d)} onClick={() => toggle(districts, setDistricts, d)}>
              {d}
            </Chip>
          ))}
        </div>
      </section>

      {/* ๒ มรดกวัฒนธรรม */}
      <section className="mt-7">
        <StepLabel no="๒" title="มรดกที่สนใจ" hint="(ว่าง = เอาทั้งหมด)" />
        <div className="flex flex-wrap gap-2">
          {ALL_HERITAGE.map((h) => (
            <Chip key={h} active={heritage.includes(h)} onClick={() => toggle(heritage, setHeritage, h)}>
              {h}
            </Chip>
          ))}
        </div>
      </section>

      {/* ๓ บรรยากาศ */}
      <section className="mt-7">
        <StepLabel no="๓" title="บรรยากาศ" />
        <div className="grid grid-cols-2 gap-2.5">
          {ATMOSPHERES.map((a) => (
            <button
              key={a.id}
              onClick={() => setAtmosphere(a.id)}
              className={`rounded-xl border p-3.5 text-left transition active:scale-95 ${
                atmosphere === a.id
                  ? "border-accent bg-accent/10 shadow-[0_8px_20px_-16px_rgba(178,58,46,0.8)]"
                  : "border-line bg-card"
              }`}
            >
              <div className="text-xl">{a.emoji}</div>
              <div className="mt-1 font-display text-[15px]">{a.label}</div>
              <div className="text-[11px] leading-snug text-muted">{a.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {error && <div className="mt-4 text-[13px] font-semibold text-accent">{error}</div>}

      {/* ปุ่มสร้าง (ลอยล่าง) */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app bg-gradient-to-t from-bg via-bg to-transparent px-6 pb-6 pt-8">
        <button
          onClick={onCreate}
          disabled={districts.length === 0}
          className="w-full rounded-xl bg-gradient-to-br from-accent to-accent2 p-4 font-bold tracking-wide text-card transition active:scale-95 disabled:opacity-40"
        >
          สร้างเส้นทาง · {matchCount} จุด →
        </button>
      </div>
    </main>
  );
}
