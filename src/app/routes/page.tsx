import Link from "next/link";
import { BASIC_ROUTES } from "@/data/routes";
import RouteCard from "@/components/RouteCard";

export default function RoutesPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-3xl px-6 pb-12 pt-6">
      <div className="flex items-center justify-between text-[11px]">
        <Link href="/" className="font-display text-accent active:opacity-60">
          ← กลับ
        </Link>
        <span className="kicker text-accent2">๐๑</span>
      </div>

      <h1 className="mt-5 font-display text-[30px] font-semibold leading-tight text-accent2">
        เส้นทางสำเร็จรูป
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        เส้นที่ออกแบบไว้รอบเกาะรัตนโกสินทร์ — แตะเพื่อเริ่มวิ่งได้ทันที
      </p>
      <div className="rule-double mt-4" />

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        {BASIC_ROUTES.map((r, i) => (
          <div
            key={r.id}
            className="rise "
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <RouteCard route={r} />
          </div>
        ))}
      </div>
    </main>
  );
}
