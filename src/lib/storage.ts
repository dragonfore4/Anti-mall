import type { RouteDef, RunRecord } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Data layer
 *
 * - ตั้งค่า Supabase แล้ว -> `SupabaseRepo` (cloud, ต่อ user)
 * - ยังไม่ตั้งค่า -> `LocalRepo` (localStorage) เพื่อให้เดโมรันได้ก่อน setup
 *
 * เมธอดข้อมูลผู้ใช้เป็น async (Supabase = network) ส่วน draft route
 * (ส่งต่อ build -> run, ไม่ผูก user) เก็บ local แบบ sync
 */
export interface RunRepository {
  getRuns(): Promise<RunRecord[]>;
  addRun(r: RunRecord): Promise<void>;

  /** id ของหมุดที่ปลดล็อกเหรียญแล้ว (จากการสแกน QR) */
  getAchievements(): Promise<string[]>;
  /** ปลดล็อกเหรียญของหมุด — คืนผลว่าปลดใหม่ / มีอยู่แล้ว / พลาด */
  unlockAchievement(checkpointId: string): Promise<"unlocked" | "already" | "error">;

  saveDraftRoute(r: RouteDef): void;
  getDraftRoute(id: string): RouteDef | null;
}

// ---------- draft route (local, sync) ใช้ร่วมกันทั้งสอง repo ----------
const KEY_DRAFTS = "rk.drafts";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function saveDraft(r: RouteDef): void {
  const drafts = readLocal<Record<string, RouteDef>>(KEY_DRAFTS, {});
  drafts[r.id] = r;
  writeLocal(KEY_DRAFTS, drafts);
}

function getDraft(id: string): RouteDef | null {
  return readLocal<Record<string, RouteDef>>(KEY_DRAFTS, {})[id] ?? null;
}

// ---------- LocalRepo (ก่อนตั้งค่า Supabase) ----------
const KEY_RUNS = "rk.runs";
const KEY_ACH = "rk.achievements";

class LocalRepo implements RunRepository {
  async getRuns(): Promise<RunRecord[]> {
    return readLocal<RunRecord[]>(KEY_RUNS, []);
  }
  async addRun(r: RunRecord): Promise<void> {
    writeLocal(KEY_RUNS, [r, ...readLocal<RunRecord[]>(KEY_RUNS, [])]);
  }
  async getAchievements(): Promise<string[]> {
    return readLocal<string[]>(KEY_ACH, []);
  }
  async unlockAchievement(checkpointId: string): Promise<"unlocked" | "already" | "error"> {
    const ids = readLocal<string[]>(KEY_ACH, []);
    if (ids.includes(checkpointId)) return "already";
    writeLocal(KEY_ACH, [...ids, checkpointId]);
    return "unlocked";
  }
  saveDraftRoute = saveDraft;
  getDraftRoute = getDraft;
}

// ---------- SupabaseRepo (cloud, ต่อ user) ----------
type RunRow = {
  id: string;
  route_name: string;
  date_iso: string;
  km: number;
  elapsed_ms: number;
  calories: number;
  steps: number;
  points: number;
  checkins: number;
};

class SupabaseRepo implements RunRepository {
  private async userId(): Promise<string | null> {
    const { data } = await createClient().auth.getUser();
    return data.user?.id ?? null;
  }

  async getRuns(): Promise<RunRecord[]> {
    const userId = await this.userId();
    if (!userId) return [];
    const { data } = await createClient()
      .from("runs")
      .select("*")
      .eq("user_id", userId) // กรองชั้นแอพด้วย ไม่พึ่ง RLS อย่างเดียว
      .order("date_iso", { ascending: false });
    return (data ?? []).map((r: RunRow) => ({
      id: r.id,
      routeName: r.route_name,
      dateISO: r.date_iso,
      km: r.km,
      elapsedMs: r.elapsed_ms,
      calories: r.calories,
      steps: r.steps,
      points: r.points,
      checkins: r.checkins,
    }));
  }

  async addRun(r: RunRecord): Promise<void> {
    const userId = await this.userId();
    if (!userId) throw new Error("ต้องเข้าสู่ระบบก่อนบันทึกการวิ่ง");
    const { error } = await createClient().from("runs").insert({
      user_id: userId,
      route_name: r.routeName,
      date_iso: r.dateISO,
      km: r.km,
      elapsed_ms: r.elapsedMs,
      calories: r.calories,
      steps: r.steps,
      points: r.points,
      checkins: r.checkins,
    });
    if (error) throw error;
  }

  async getAchievements(): Promise<string[]> {
    const userId = await this.userId();
    if (!userId) return [];
    const { data } = await createClient()
      .from("achievements")
      .select("checkpoint_id")
      .eq("user_id", userId);
    return (data ?? []).map((a: { checkpoint_id: string }) => a.checkpoint_id);
  }

  async unlockAchievement(checkpointId: string): Promise<"unlocked" | "already" | "error"> {
    const userId = await this.userId();
    if (!userId) return "error";
    // upsert + ignoreDuplicates: ถ้าชนของเดิม -> ไม่คืนแถว = "already" (ไม่พึ่งรหัส error 23505)
    const { data, error } = await createClient()
      .from("achievements")
      .upsert(
        { user_id: userId, checkpoint_id: checkpointId },
        { onConflict: "user_id,checkpoint_id", ignoreDuplicates: true },
      )
      .select();
    if (error) return "error";
    return data && data.length > 0 ? "unlocked" : "already";
  }

  saveDraftRoute = saveDraft;
  getDraftRoute = getDraft;
}

export const repo: RunRepository = isSupabaseConfigured ? new SupabaseRepo() : new LocalRepo();
