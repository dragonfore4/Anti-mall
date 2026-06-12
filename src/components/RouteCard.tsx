import Link from "next/link";
import type { RouteDef } from "@/types";
import { atmosphereById } from "@/data/options";

export default function RouteCard({ route }: { route: RouteDef }) {
  const atmo = atmosphereById(route.atmosphere);
  return (
    <Link
      href={`/run/${route.id}`}
      className="card-paper group block rounded-xl p-4 transition active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug">{route.name}</h3>
        {atmo && (
          <span className="shrink-0 rounded-full border border-accent2/60 px-2 py-0.5 text-[10.5px] font-semibold text-accent2">
            {atmo.label}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{route.desc}</p>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[12px] text-muted">
        <div className="flex gap-4">
          <span>
            <b className="font-display text-ink">{route.distanceKm}</b> กม.
          </span>
          <span>
            <b className="font-display text-ink">{route.checkpointIds.length}</b> จุดเช็คอิน
          </span>
        </div>
        <span className="text-lg text-accent transition-transform group-active:translate-x-1">→</span>
      </div>
    </Link>
  );
}
