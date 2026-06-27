import Link from "next/link";
import HeroStats from "@/components/HeroStats";
import AuthButton from "@/components/AuthButton";
import RoadBg from "@/components/RoadBg";
import Sunburst from "@/components/Sunburst";
import Medal from "@/components/Medal";
import Mascot from "@/components/Mascot";

const MODES = [
  {
    no: "๐๑",
    href: "/routes",
    kind: "Basic",
    title: "เส้นทางสำเร็จรูป",
    desc: "เลือกเส้นที่ออกแบบไว้ให้ — ครบทุกหมุดมรดก พร้อมวิ่งทันที",
  },
  {
    no: "๐๒",
    href: "/build",
    kind: "Advance",
    title: "ออกแบบเส้นทางเอง",
    desc: "เลือกย่าน → มรดกที่สนใจ → บรรยากาศ แล้วให้ระบบร้อยเส้นทางให้",
  },
];

// เปรียบเทียบ "สองโลกในสองชั่วโมง"
const COMPARE = [
  { icon: "🔥", label: "แคลอรี่", mall: "~๑๒๐", run: "~๗๒๐" },
  { icon: "💸", label: "ใช้จ่าย", mall: "฿๘๕๐", run: "฿๐" },
  { icon: "📖", label: "เกร็ดความรู้", mall: "๐", run: "๘ จุด" },
  { icon: "🍃", label: "บรรยากาศ", mall: "แอร์ ๒๒°", run: "ลมเมืองเก่า" },
];

// ทีมผู้จัดทำ
const TEAM = [
  "ภูรินทร์ บุญรอด",
  "กันตพร พรมรักษา",
  "ณชนก กบิลบุตร",
  "ธนัญญา นาคนิยม",
  "พรไพลิน สังสะเกตุ",
];

export default function HomePage() {
  return (
    <main className="relative isolate mx-auto flex min-h-[100dvh] w-full max-w-app flex-col px-6 pb-9 pt-6 md:max-w-2xl md:px-8 lg:max-w-3xl">
      <RoadBg className="opacity-90" />

      {/* เลขหน้า มุมขวาบน */}
      <div className="rise flex justify-end">
        <span className="kicker text-[11px] text-accent2">๐๑</span>
      </div>

      {/* โลโก้ young (keep) vibes — กลาง + มาสคอตวิ่งข้าง ๆ */}
      <div
        className="rise mt-1 flex select-none items-center justify-center gap-1"
        style={{ animationDelay: "60ms" }}
      >
        <div className="relative text-center">
          <div className="font-brand text-[58px] font-bold leading-[0.78] text-accent2">
            young
          </div>
          <div className="font-brand text-[58px] font-bold leading-[0.78] text-accent2">
            vibes
          </div>
          <span className="absolute right-1 top-[38px] -rotate-6 font-display text-base font-bold text-accent">
            (keep)
          </span>
        </div>
        <Mascot className="h-32 w-28 shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]" />
      </div>
      <div className="rise mt-1 text-center font-display text-[11.5px] uppercase tracking-[0.2em] text-muted">
        วิ่งเก็บมรดก · ไม่เผาเงินในห้าง
      </div>

      {/* แถบโลโก้ + ปุ่มเข้าสู่ระบบ (ตามดีไซน์) */}
      <div
        className="rise mt-5 flex items-center justify-between"
        style={{ animationDelay: "100ms" }}
      >
        <span className="font-brand text-lg font-bold text-cream">
          young<span className="text-accent2">vibes</span>
        </span>
        <AuthButton />
      </div>
      <div
        className="rule-double rise mt-3"
        style={{ animationDelay: "120ms" }}
      />

      {/* Hero */}
      <header className="mt-7">
        <div
          className="kicker rise text-[11px] text-accent2"
          style={{ animationDelay: "120ms" }}
        >
          ๐๑ — CULTURAL ROUTE
        </div>
        <h1
          className="rise mt-4 font-display text-[46px] font-extrabold leading-[1.02] tracking-tight text-accent2 md:text-[64px]"
          style={{ animationDelay: "180ms" }}
        >
          วิ่งรอบเกาะ
          <br />
          รัตนโกสินทร์
        </h1>
        <p
          className="rise mt-5 max-w-[33ch] text-[15px] leading-relaxed text-accent"
          style={{ animationDelay: "260ms" }}
        >
          ทิ้งห้างแอร์เย็น มาวิ่งตามรอยวัด วัง ป้อม และตรอกเก่ากลางพระนคร
          เก็บเกร็ดประวัติศาสตร์ทีละจุด สแกน QR สะสมเหรียญสถานที่
        </p>

        {/* แถบสถิติสด */}
        <HeroStats />
      </header>

      {/* ๐๒ สองโลกในสองชั่วโมง */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">สองโลก ในสองชั่วโมง</h2>
          <span className="kicker text-[11px] text-accent2">๐๒</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          เวลาเท่ากัน แต่ได้กลับมาคนละอย่าง
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {/* ห้างแอร์ */}
          <div className="card-cream relative rounded-2xl px-4 pb-5 pt-10">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
              <Sunburst size={58}>🏬</Sunburst>
            </span>
            <div className="text-center font-display text-lg font-bold">
              ห้างแอร์
            </div>
            <div className="mx-auto mt-0.5 h-0.5 w-8 rounded-full bg-bg/15" />
            <dl className="mt-3 space-y-3">
              {COMPARE.map((row) => (
                <div key={row.label}>
                  <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-45">
                    <span className="text-[12px] leading-none">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-[17px] font-medium opacity-70">
                    {row.mall}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {/* เมืองเก่า (เน้น — ตัวเลือกที่ดีกว่า) */}
          <div className="card-cream relative rounded-2xl px-4 pb-5 pt-10 ring-2 ring-accent">
            {/* แสงอุ่นจาง ๆ (โค้งตามการ์ด ไม่ใช้ overflow-hidden จะได้ไม่ตัดดาว) */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-accent/12 via-transparent to-accent2/10" />
            {/* ป้ายผู้ชนะ */}
            <span className="absolute right-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold tracking-wide text-cream">
              ★ คุ้มกว่า
            </span>
            <span className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] overflow-visible">
              <Sunburst size={58} fill="var(--color-accent)">
                🏃
              </Sunburst>
            </span>
            <div className="relative text-center font-display text-lg font-bold text-accent">
              เมืองเก่า
            </div>
            <div className="relative mx-auto mt-0.5 h-0.5 w-8 rounded-full bg-accent/30" />
            <dl className="relative mt-3 space-y-3">
              {COMPARE.map((row) => (
                <div key={row.label}>
                  <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-accent/55">
                    <span className="text-[12px] leading-none">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-[17px] font-bold text-accent">
                    {row.run}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <p className="mt-3 text-center text-[11.5px] text-muted">
          จะเผาแคลฯ หรือเผาเงิน —{" "}
          <span className="text-accent">คุณเลือกได้</span>
        </p>
      </section>

      {/* ๐๓ เลือกโหมด */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">เลือกโหมดการวิ่ง</h2>
          <span className="kicker text-[11px] text-accent2">๐๓</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {MODES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`group flex items-center gap-3 rounded-full bg-cream py-2.5 pl-2.5 pr-5 text-bg transition active:scale-[0.99] ${m.kind === "Advance" ? "opacity-100" : ""}`}
            >
              <Medal
                size={56}
                outerFill="var(--color-accent2)"
                ribbon="var(--color-accent2)"
                className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
              >
                <span className="font-display text-base font-extrabold text-bg">
                  {m.no}
                </span>
              </Medal>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-display text-lg font-semibold leading-tight ${m.kind === "Advance" ? "" : ""}`}
                  >
                    {m.title}
                  </h3>
                  <span className="rounded-full bg-bg/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {m.kind}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-bg/70">
                  {m.desc}
                </p>
              </div>
              <span className="text-2xl text-accent transition-transform group-active:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ๐๔ ออกแบบภารกิจวิ่ง (teaser → /build) */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">ออกแบบภารกิจวิ่ง</h2>
          <span className="kicker text-[11px] text-accent2">๐๔</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          เลือกระดับการเผา → ธีมมรดก → เวลา แล้วให้ระบบร้อยเส้นทางให้
        </p>

        <div className="mt-4 space-y-4">
          {[
            {
              no: "๐๑",
              step: "ระดับการเผา",
              items: [
                "🧋 ชานมไข่มุก · ~๓๕๐",
                "🍗 ข้าวมันไก่ทอด · ~๖๐๐",
                "🔥 บุฟเฟ่ต์แก้แค้น · ~๑๐๐๐+",
              ],
            },
            {
              no: "๐๒",
              step: "ธีมมรดก",
              items: [
                "🏛 นักล่าซุ้มโค้ง",
                "🙏 วิ่งสายมู",
                "🍜 ของกินช่างฝีมือ",
              ],
            },
            {
              no: "๐๓",
              step: "เวลา",
              items: ["🌅 ๐๕:๓๐ เช้าตรู่", "🌃 ๑๙:๐๐ ค่ำคืนแสงไฟ"],
            },
          ].map((s) => (
            <div key={s.no}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-display text-xs font-bold text-cream">
                  {s.no}
                </span>
                <span className="rounded-full bg-cream px-3 py-1 font-display text-[14px] font-semibold text-bg">
                  {s.step}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <span
                    key={it}
                    className="chip rounded-full px-3 py-1.5 text-[12px]"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ๐๕ ลัด */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">สะสม &amp; ย้อนดู</h2>
          <span className="kicker text-[11px] text-accent2">๐๕</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/achievements"
            className="flex flex-col items-center gap-3 active:scale-[0.97]"
          >
            <Medal
              size={120}
              innerFill="var(--color-accent)"
              ribbon="var(--color-accent)"
            >
              <div className="font-display text-[15px] font-bold leading-tight text-cream">
                เหรียญ
                <br />
                สถานที่
              </div>
            </Medal>
            <div className="px-2 text-center text-[11.5px] leading-snug text-muted">
              สแกน QR ตามจุดเพื่อสะสมเหรียญ
            </div>
          </Link>
          <Link
            href="/history"
            className="flex flex-col items-center gap-3 active:scale-[0.97]"
          >
            <Medal
              size={120}
              innerFill="var(--color-accent)"
              ribbon="var(--color-accent)"
            >
              <div className="font-display text-[15px] font-bold leading-tight text-cream">
                ประวัติ
                <br />
                การวิ่ง
              </div>
            </Medal>
            <div className="px-2 text-center text-[11.5px] leading-snug text-muted">
              สถิติย้อนหลังทุกครั้งที่วิ่ง
            </div>
          </Link>
        </div>
      </section>

      {/* แถลงการณ์ (footer) */}
      <footer className="mt-12">
        <div className="rule-double" />
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="font-display text-base leading-tight">
              วิ่งรอบเกาะ
              <br />
              รัตนโกสินทร์
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
              วิ่งเก็บมรดก · ไม่เผาเงินในห้าง · ๒๕๖๙
            </div>
          </div>
          <div className="text-right text-[11px] leading-loose text-muted">
            <Link href="/routes" className="block active:text-accent">
              เส้นทาง
            </Link>
            <Link href="/achievements" className="block active:text-accent">
              เหรียญสถานที่
            </Link>
          </div>
        </div>
        {/* ทีมผู้จัดทำ */}
        <div className="mt-6 border-t border-line pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
            ทีมผู้จัดทำ
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            {TEAM.map((name) => (
              <span key={name} className="text-ink">
                {name}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[10.5px] uppercase tracking-[0.2em] text-accent2/70">
          ◆ วิ่งช้า ๆ มองเมืองให้ทัน ◆
        </p>
      </footer>
    </main>
  );
}
