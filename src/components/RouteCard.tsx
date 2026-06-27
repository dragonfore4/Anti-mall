import Link from "next/link";
import type { RouteDef } from "@/types";
import { atmosphereById } from "@/data/options";
import Sunburst from "@/components/Sunburst";

export default function RouteCard({ route }: { route: RouteDef }) {
  const atmo = atmosphereById(route.atmosphere);
  return (
    <Link
      href={`/run/${route.id}`}
      className="card-paper group flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.98] h-full"
    >
      <Sunburst size={64}>{atmo?.emoji ?? "🏃"}</Sunburst>
      <div className="min-w-0 flex-1 ">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-snug">
            {route.name}
          </h3>
          {atmo && (
            <span className="shrink-0 rounded-full border border-accent2/60 px-2 py-0.5 text-[10.5px] font-semibold text-accent2">
              {atmo.label}
            </span>
          )}
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {route.desc}
        </p>
        <div className="mt-2 flex gap-4 text-[12px] text-muted">
          <span>
            <b className="font-display text-ink">{route.distanceKm}</b> กม.
          </span>
          <span>
            <b className="font-display text-ink">
              {route.checkpointIds.length}
            </b>{" "}
            จุดเช็คอิน
          </span>
        </div>
      </div>
      <span className="self-center text-xl text-accent transition-transform group-active:translate-x-1">
        →
      </span>
    </Link>
  );
}
