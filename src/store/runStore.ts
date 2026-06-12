import { create } from "zustand";
import type { LatLng, RouteDef, RunMode, RunStatus } from "@/types";
import { distanceM } from "@/lib/geo";
import { checkpointById } from "@/data/checkpoints";
import { CHECKIN_RADIUS_M, GPS_JUMP_MAX_M } from "@/lib/stats";

interface RunState {
  status: RunStatus;
  mode: RunMode;
  route: RouteDef | null;

  trace: LatLng[]; // เส้นทางที่วิ่งจริง
  current: LatLng | null; // ตำแหน่งปัจจุบัน
  distanceM: number;
  startTime: number;
  elapsedMs: number;

  points: number;
  checkedIn: string[]; // id ของจุดที่เช็คอินแล้ว
  lastCheckin: { name: string; fact: string; pts: number } | null;

  // actions
  begin: (route: RouteDef, mode: RunMode) => void;
  pushPosition: (ll: LatLng) => void;
  tick: () => void;
  finish: () => void;
  reset: () => void;
  clearLastCheckin: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  status: "idle",
  mode: "sim",
  route: null,
  trace: [],
  current: null,
  distanceM: 0,
  startTime: 0,
  elapsedMs: 0,
  points: 0,
  checkedIn: [],
  lastCheckin: null,

  begin: (route, mode) =>
    set({
      status: "running",
      mode,
      route,
      trace: [],
      current: null,
      distanceM: 0,
      startTime: Date.now(),
      elapsedMs: 0,
      points: 0,
      checkedIn: [],
      lastCheckin: null,
    }),

  pushPosition: (ll) => {
    const s = get();
    if (s.status !== "running") return;

    // สะสมระยะ + กรอง noise (ตัดจุดที่กระโดดไกลผิดปกติ)
    let dist = s.distanceM;
    if (s.current) {
      const d = distanceM(s.current, ll);
      if (d < GPS_JUMP_MAX_M) dist += d;
    }

    // ตรวจ check-in จุดที่ยังไม่เคยเช็คอิน
    let { points, checkedIn, lastCheckin } = s;
    const route = s.route;
    if (route) {
      for (const cpId of route.checkpointIds) {
        if (checkedIn.includes(cpId)) continue;
        const cp = checkpointById(cpId);
        if (cp && distanceM(ll, cp.ll) <= CHECKIN_RADIUS_M) {
          checkedIn = [...checkedIn, cpId];
          points += cp.pts;
          lastCheckin = { name: cp.name, fact: cp.fact, pts: cp.pts };
        }
      }
    }

    set({
      current: ll,
      trace: [...s.trace, ll],
      distanceM: dist,
      points,
      checkedIn,
      lastCheckin,
    });
  },

  tick: () => {
    const s = get();
    if (s.status !== "running") return;
    set({ elapsedMs: Date.now() - s.startTime });
  },

  finish: () => set({ status: "finished" }),

  reset: () =>
    set({
      status: "idle",
      route: null,
      trace: [],
      current: null,
      distanceM: 0,
      startTime: 0,
      elapsedMs: 0,
      points: 0,
      checkedIn: [],
      lastCheckin: null,
    }),

  clearLastCheckin: () => set({ lastCheckin: null }),
}));
