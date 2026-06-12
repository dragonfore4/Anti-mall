"use client";

import { useEffect, useState } from "react";

const toThai = (s: string) => s.replace(/[0-9]/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[+d]);

/** นับเลขวิ่งขึ้นตอนเข้าหน้า (ease-out) */
function useCountUp(target: number, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function HeroStats() {
  const cals = useCountUp(1243000);

  // นักวิ่งออนไลน์: เริ่มที่ ๔๒๗ แล้วขยับเล็กน้อยให้รู้สึก "สด"
  const [online, setOnline] = useState(427);
  useEffect(() => {
    const id = setInterval(() => {
      setOnline((n) => {
        const next = n + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
        return Math.max(411, Math.min(446, next));
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { n: toThai(String(online)), l: "วิ่งออนไลน์" },
    { n: toThai((cals / 1_000_000).toFixed(2)) + "M", l: "แคลฯ รวม" },
    { n: "๙", l: "หมุดมรดก" },
  ];

  return (
    <div className="rise mt-7" style={{ animationDelay: "340ms" }}>
      <div className="mb-2 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-muted">
        <span className="livedot" />
        สด · ชุมชนวันนี้
      </div>
      <dl className="grid grid-cols-3 border-y border-line">
        {stats.map((s, i) => (
          <div key={s.l} className={`py-3.5 ${i < 2 ? "border-r border-line pr-2" : ""} ${i > 0 ? "pl-4" : ""}`}>
            <dt className="font-display text-2xl leading-none tabular-nums text-ink">{s.n}</dt>
            <dd className="mt-1 text-[11px] uppercase tracking-wider text-muted">{s.l}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
