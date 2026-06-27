interface Stat {
  value: string;
  label: string;
}

export default function StatsBar({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-4 gap-2"}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-bg/10 bg-cream/95 px-1.5 py-2.5 text-center shadow-[0_8px_20px_-14px_rgba(0,0,0,0.6)] backdrop-blur"
        >
          <div className="font-display text-lg font-semibold leading-none text-bg">{s.value}</div>
          <div className="mt-1 text-[10px] tracking-wide text-bg/60">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
