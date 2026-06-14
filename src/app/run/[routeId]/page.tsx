"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RouteDef, RunMode } from "@/types";
import { basicRouteById } from "@/data/routes";
import { repo } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";
import { useRunStore } from "@/store/runStore";
import { densify, metersToKm, pathLengthM } from "@/lib/geo";
import { snapToRoads } from "@/lib/snapToRoads";
import { fmtTime, steps } from "@/lib/stats";
import { useWakeLock } from "@/lib/useWakeLock";
import StatsBar from "@/components/StatsBar";
import CheckinToast from "@/components/CheckinToast";
import SummaryModal from "@/components/SummaryModal";

// แผนที่ต้องโหลดฝั่ง client เท่านั้น (Leaflet อ้าง window)
const RunMap = dynamic(() => import("@/components/RunMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-muted">กำลังโหลดแผนที่…</div>,
});

export default function RunPage({ params }: { params: Promise<{ routeId: string }> }) {
  const { routeId } = use(params);

  // หา route: Basic ก่อน ไม่เจอค่อยดู draft (Advance) ใน localStorage
  const [route, setRoute] = useState<RouteDef | null | undefined>(undefined);
  const [snapping, setSnapping] = useState(false);
  useEffect(() => {
    const base = basicRouteById(routeId) ?? repo.getDraftRoute(routeId);
    if (!base) {
      setRoute(null);
      return;
    }
    // base.path = พิกัดหมุดเรียงตามลำดับอยู่แล้ว (derive จาก checkpointIds)
    // แสดงเส้นตรงก่อนทันที แล้วค่อยอัปเกรดเป็นเส้นเกาะถนนจริงเมื่อ ORS ตอบ
    setRoute(base);
    setSnapping(true);
    let cancelled = false;
    snapToRoads(base.path).then((snapped) => {
      if (cancelled) return;
      setSnapping(false);
      if (snapped !== base.path) {
        setRoute({
          ...base,
          path: snapped,
          distanceKm: metersToKm(pathLengthM(snapped)),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const [mode, setMode] = useState<RunMode>("sim");
  const s = useRunStore();
  const savedRef = useRef(false);
  const router = useRouter();
  const { user } = useUser();

  // เริ่มวิ่ง — ถ้าต่อ Supabase แล้วต้อง login ก่อน (เพื่อบันทึกผลต่อ user)
  const onStart = () => {
    if (!route) return;
    if (isSupabaseConfigured && !user) {
      router.push(`/login?next=${encodeURIComponent(`/run/${routeId}`)}`);
      return;
    }
    useRunStore.getState().begin(route, mode);
  };

  useWakeLock(s.status === "running" && mode === "gps");

  // ลูปติดตามตำแหน่ง (sim / gps) + นาฬิกาจับเวลา
  useEffect(() => {
    if (s.status !== "running" || !route) return;
    const tick = setInterval(() => useRunStore.getState().tick(), 500);
    let cleanup = () => clearInterval(tick);

    if (mode === "sim") {
      const path = densify(route.path);
      let i = 0;
      const sim = setInterval(() => {
        if (i >= path.length) {
          useRunStore.getState().finish();
          return;
        }
        useRunStore.getState().pushPosition(path[i]);
        i++;
      }, 180);
      cleanup = () => {
        clearInterval(tick);
        clearInterval(sim);
      };
    } else {
      if (!navigator.geolocation) {
        alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
      } else {
        const watch = navigator.geolocation.watchPosition(
          (p) => useRunStore.getState().pushPosition([p.coords.latitude, p.coords.longitude]),
          (e) => alert("เปิด GPS ไม่ได้: " + e.message + "\n(ต้องเปิดผ่าน HTTPS หรือ localhost)"),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
        );
        cleanup = () => {
          clearInterval(tick);
          navigator.geolocation.clearWatch(watch);
        };
      }
    }
    return cleanup;
  }, [s.status, mode, route]);

  // บันทึกผลเมื่อจบ (ครั้งเดียว)
  useEffect(() => {
    if (s.status !== "finished" || !route || savedRef.current) return;
    savedRef.current = true;
    repo
      .addRun({
        id: `run-${Date.now()}`,
        routeName: route.name,
        dateISO: new Date().toISOString(),
        km: +(s.distanceM / 1000).toFixed(2),
        elapsedMs: s.elapsedMs,
        calories: s.calories,
        steps: steps(s.distanceM),
        points: s.points,
        checkins: s.checkedIn.length,
      })
      .catch((e) => console.error("บันทึกการวิ่งไม่สำเร็จ:", e));
  }, [s.status, route, s.distanceM, s.elapsedMs, s.points, s.calories, s.checkedIn.length]);

  // รีเซ็ตเมื่อออกจากหน้า
  useEffect(() => () => useRunStore.getState().reset(), []);

  const km = (s.distanceM / 1000).toFixed(2);
  const statList = useMemo(
    () => [
      { value: km, label: "กิโลเมตร" },
      { value: fmtTime(s.elapsedMs), label: "เวลา" },
      { value: String(s.calories), label: "แคลอรี่" },
      { value: steps(s.distanceM).toLocaleString(), label: "ก้าว" },
    ],
    [km, s.elapsedMs, s.distanceM, s.calories],
  );

  const onShare = async () => {
    const text = `🏃 ฉันวิ่ง "${route?.name}" ${km} กม. ใน ${fmtTime(
      s.elapsedMs,
    )} น. ได้ ${s.points} แต้ม! #วิ่งรอบเกาะรัตนโกสินทร์`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ผลการวิ่ง", text });
      } catch {
        /* ผู้ใช้ยกเลิก */
      }
    } else {
      alert("ข้อความแชร์ (เดโม):\n\n" + text);
    }
  };

  if (route === undefined)
    return <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>;

  if (route === null)
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="text-4xl">🤔</div>
        <div className="text-muted">ไม่พบเส้นทางนี้ (อาจถูกล้างจาก browser)</div>
        <Link href="/" className="rounded-2xl bg-card2 px-4 py-2 font-bold">
          กลับหน้าหลัก
        </Link>
      </main>
    );

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden">
      {/* หัว */}
      <header className="z-[500] flex items-center gap-3 border-b border-line bg-card px-4 py-3">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] leading-tight">{route.name}</div>
          <div className="text-[11px] text-muted">
            {route.distanceKm} กม. · {route.checkpointIds.length} จุด
            {snapping && <span className="text-accent"> · กำลังดัดเส้นให้เกาะถนน…</span>}
          </div>
        </div>
      </header>

      {/* แผนที่ */}
      <div className="relative flex-1">
        <RunMap route={route} trace={s.trace} current={s.current} checkedIn={s.checkedIn} />

        {/* สถิติลอย */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[600]">
          <StatsBar stats={statList} />
        </div>

        {/* แต้มสด */}
        <div className="absolute right-3 top-[86px] z-[600] rounded-full border border-accent bg-card/90 px-3 py-1 text-sm font-bold text-accent backdrop-blur">
          🏆 {s.points}
        </div>

        <CheckinToast data={s.lastCheckin} onClose={() => useRunStore.getState().clearLastCheckin()} />
      </div>

      {/* แผงควบคุม */}
      <div className="z-[600] bg-card p-4">
        {s.status === "idle" && (
          <div className="flex items-center gap-2.5">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RunMode)}
              className="rounded-xl border border-line bg-card2 px-3 py-3 text-sm"
            >
              <option value="sim">จำลองวิ่ง</option>
              <option value="gps">GPS จริง</option>
            </select>
            <button
              onClick={onStart}
              className="flex-1 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold tracking-wide text-card active:scale-95"
            >
              ▶ เริ่มวิ่ง
            </button>
          </div>
        )}
        {s.status === "running" && (
          <button
            onClick={() => useRunStore.getState().finish()}
            className="w-full rounded-xl bg-ink p-3.5 font-bold tracking-wide text-card active:scale-95"
          >
            ■ จบการวิ่ง
          </button>
        )}
      </div>

      {/* สรุปผล */}
      {s.status === "finished" && (
        <SummaryModal
          km={km}
          time={fmtTime(s.elapsedMs)}
          cal={s.calories}
          steps={steps(s.distanceM)}
          points={s.points}
          checkins={s.checkedIn.length}
          onShare={onShare}
        />
      )}
    </main>
  );
}
