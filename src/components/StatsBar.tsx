interface Stat {
  value: string;
  label: string;
}

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-line bg-card/95 px-1.5 py-2.5 text-center shadow-[0_8px_20px_-14px_rgba(33,26,18,0.6)] backdrop-blur"
        >
          <div className="font-display text-lg leading-none text-ink">{s.value}</div>
          <div className="mt-1 text-[10px] tracking-wide text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
