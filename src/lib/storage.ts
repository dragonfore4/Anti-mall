import type { RouteDef, RunRecord } from "@/types";

/**
 * Data layer — local-first (เก็บใน browser localStorage)
 *
 * ออกแบบเป็น interface เดียว เพื่อให้สลับไปใช้ Supabase ได้ภายหลัง
 * โดยไม่ต้องแก้โค้ดหน้าเว็บ — แค่เขียน SupabaseRepo ที่ implement interface นี้
 * แล้วสลับตัว `repo` ที่ export ด้านล่าง
 *
 *   // ตัวอย่างเมื่อต่อ Supabase จริง:
 *   // export const repo: RunRepository = new SupabaseRepo(client);
 */
export interface RunRepository {
  getRuns(): RunRecord[];
  addRun(r: RunRecord): void;
  totalPoints(): number;
  // เส้นทางที่ผู้ใช้สร้างเอง (Advance) — ส่งต่อระหว่างหน้า build -> run
  saveDraftRoute(r: RouteDef): void;
  getDraftRoute(id: string): RouteDef | null;
}

const KEY_RUNS = "rk.runs";
const KEY_DRAFTS = "rk.drafts";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

class LocalRepo implements RunRepository {
  getRuns(): RunRecord[] {
    return read<RunRecord[]>(KEY_RUNS, []);
  }

  addRun(r: RunRecord): void {
    const runs = this.getRuns();
    runs.unshift(r);
    write(KEY_RUNS, runs);
  }

  totalPoints(): number {
    return this.getRuns().reduce((sum, r) => sum + r.points, 0);
  }

  saveDraftRoute(r: RouteDef): void {
    const drafts = read<Record<string, RouteDef>>(KEY_DRAFTS, {});
    drafts[r.id] = r;
    write(KEY_DRAFTS, drafts);
  }

  getDraftRoute(id: string): RouteDef | null {
    const drafts = read<Record<string, RouteDef>>(KEY_DRAFTS, {});
    return drafts[id] ?? null;
  }
}

export const repo: RunRepository = new LocalRepo();
