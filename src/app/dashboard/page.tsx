import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { ageFromDob } from "@/lib/age";
import Sunburst from "@/components/Sunburst";

// อ่านข้อมูลสด ๆ ทุกครั้ง (ไม่ cache) เพราะเป็นสถิติผู้ใช้ที่เปลี่ยนตลอด
export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  created_at: string;
}
interface RunRow {
  km: number | null;
  calories: number | null;
  steps: number | null;
  points: number | null;
}

/** ช่วงอายุสำหรับกราฟการกระจาย */
const AGE_BUCKETS = [
  { label: "ต่ำกว่า ๒๐", test: (a: number) => a < 20 },
  { label: "๒๐–๒๙", test: (a: number) => a >= 20 && a <= 29 },
  { label: "๓๐–๓๙", test: (a: number) => a >= 30 && a <= 39 },
  { label: "๔๐ ขึ้นไป", test: (a: number) => a >= 40 },
] as const;

const nf = new Intl.NumberFormat("th-TH");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

export default async function DashboardPage() {
  // 1) Gate: ต้อง login ก่อน (ตามที่เลือก = ใครก็ได้ที่ login)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // 2) ยังไม่ได้ตั้ง service_role → โชว์วิธีตั้งค่าแทน (ไม่ crash)
  if (!isAdminConfigured) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-app px-6 py-10">
        <Header />
        <div className="mt-6 rounded-2xl border border-line bg-card p-5 text-sm leading-relaxed">
          <p className="font-display text-accent2">ยังตั้งค่าไม่ครบ</p>
          <p className="mt-2 text-muted">
            แดชบอร์ดต้องอ่านข้อมูลผู้ใช้ทุกคน (ข้าม RLS) จึงต้องมี service_role key —
            เพิ่มบรรทัดนี้ใน <code className="text-accent2">.env.local</code> แล้วรีสตาร์ท dev server:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-bg p-3 text-xs text-cream">
            SUPABASE_SERVICE_ROLE_KEY=&lt;service_role key จาก Supabase → Settings → API&gt;
          </pre>
        </div>
      </main>
    );
  }

  // 3) ดึงข้อมูลทุกคนผ่าน admin client (bypass RLS)
  const admin = createAdminClient();
  const [profilesRes, runsRes, medalRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id,first_name,last_name,dob,created_at")
      .order("created_at", { ascending: false }),
    admin.from("runs").select("km,calories,steps,points"),
    admin.from("achievements").select("*", { count: "exact", head: true }),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const runs = (runsRes.data ?? []) as RunRow[];
  const medalCount = medalRes.count ?? 0;

  // 4) คำนวณสถิติฝั่ง server
  const userCount = profiles.length;
  let sumKm = 0;
  let sumCalories = 0;
  let sumSteps = 0;
  let sumPoints = 0;
  for (const r of runs) {
    sumKm += Number(r.km ?? 0);
    sumCalories += r.calories ?? 0;
    sumSteps += r.steps ?? 0;
    sumPoints += r.points ?? 0;
  }
  const runStats = { km: sumKm, calories: sumCalories, steps: sumSteps, points: sumPoints };
  const runCount = runs.length;
  const avgPoints = userCount ? Math.round(runStats.points / userCount) : 0;

  // การกระจายอายุ
  const ages = profiles.map((p) => ageFromDob(p.dob));
  const buckets: { label: string; count: number }[] = AGE_BUCKETS.map((b) => ({
    label: b.label,
    count: ages.filter((a): a is number => a !== null && b.test(a)).length,
  }));
  const unknownAge = ages.filter((a) => a === null).length;
  if (unknownAge) buckets.push({ label: "ไม่ระบุ", count: unknownAge });
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  const newest = profiles.slice(0, 5);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-app px-6 pb-16 pt-6">
      <Header />

      {/* การ์ดสรุป 4 ใบ */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard emoji="👥" label="ผู้ใช้ทั้งหมด" value={nf.format(userCount)} />
        <StatCard emoji="🏃" label="เที่ยววิ่งรวม" value={nf.format(runCount)} />
        <StatCard emoji="⭐" label="แต้มรวม" value={nf.format(runStats.points)} />
        <StatCard emoji="🏅" label="เหรียญรวม" value={nf.format(medalCount)} />
      </section>

      {/* การกระจายอายุ */}
      <section className="mt-8">
        <SectionTitle>การกระจายอายุ</SectionTitle>
        <div className="mt-3 space-y-2.5 rounded-2xl border border-line bg-card p-4">
          {buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-xs text-muted">{b.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-card2">
                <div
                  className="h-full rounded-full bg-accent2"
                  style={{ width: `${(b.count / maxBucket) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-sm font-bold text-accent2">{nf.format(b.count)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* สถิติการวิ่ง/แต้ม */}
      <section className="mt-8">
        <SectionTitle>สถิติการวิ่ง/แต้ม</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="ระยะรวม (กม.)" value={nf.format(Math.round(runStats.km * 10) / 10)} />
          <MiniStat label="แคลอรี่รวม" value={nf.format(runStats.calories)} />
          <MiniStat label="ก้าวรวม" value={nf.format(runStats.steps)} />
          <MiniStat label="เฉลี่ยแต้ม/คน" value={nf.format(avgPoints)} />
        </div>
      </section>

      {/* ผู้ใช้ใหม่ล่าสุด */}
      <section className="mt-8">
        <SectionTitle>ผู้ใช้ใหม่ล่าสุด</SectionTitle>
        <div className="mt-3 space-y-2">
          {newest.length === 0 && <Empty />}
          {newest.map((p) => {
            const age = ageFromDob(p.dob);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3"
              >
                <Sunburst size={36}>{(p.first_name?.[0] ?? "?").toUpperCase()}</Sunburst>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm">
                    {p.first_name || "ไม่ระบุชื่อ"} {p.last_name ?? ""}
                  </div>
                  <div className="text-[11px] text-muted">
                    {age !== null ? `อายุ ${age} ปี` : "อายุ —"} · สมัคร {fmtDate(p.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ตารางผู้ใช้ทั้งหมด */}
      <section className="mt-8">
        <SectionTitle>ผู้ใช้ทั้งหมด · {nf.format(userCount)} คน</SectionTitle>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card2 text-left font-display text-accent2">
                <th className="px-4 py-2.5 font-medium">ชื่อ</th>
                <th className="px-4 py-2.5 font-medium">นามสกุล</th>
                <th className="px-4 py-2.5 text-center font-medium">อายุ</th>
                <th className="px-4 py-2.5 text-right font-medium">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
              {profiles.map((p) => {
                const age = ageFromDob(p.dob);
                return (
                  <tr key={p.id} className="border-t border-line odd:bg-card even:bg-card/40">
                    <td className="px-4 py-2.5">{p.first_name || "—"}</td>
                    <td className="px-4 py-2.5">{p.last_name || "—"}</td>
                    <td className="px-4 py-2.5 text-center">{age !== null ? age : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{fmtDate(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <h1 className="font-display text-xl">แดชบอร์ด</h1>
      </div>
      <span className="kicker text-[11px] text-accent2">สถิติผู้ใช้</span>
    </header>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-semibold text-accent2">{children}</h2>;
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-gradient-to-br from-card to-card2 p-4 text-center">
      <span className="text-2xl">{emoji}</span>
      <span className="font-display text-2xl font-bold text-accent2">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3 text-center">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function Empty() {
  return <div className="rounded-2xl border border-line bg-card p-4 text-sm text-muted">ยังไม่มีข้อมูล</div>;
}
