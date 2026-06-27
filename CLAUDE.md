# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

โปรเจ็คจริง (Next.js) ของ "วิ่งรอบเกาะรัตนโกสินทร์" — เว็บแอพวิ่งเชิงท่องเที่ยววัฒนธรรม รวม GPS tracking + เกมสะสมแต้ม + เกร็ดความรู้มรดก + Google login + สแกน QR สะสมเหรียญ ดูคอนเซ็ปต์/ฟีเจอร์ภาพรวมที่ `../CLAUDE.md` (ราก) ไฟล์นี้เน้นสถาปัตยกรรมของโค้ดจริงในโฟลเดอร์ `web/`

> เอกสารเสริม: คู่มือ maintainer [`README.md`](README.md) / [`docs/maintainer-guide.html`](docs/maintainer-guide.html) · อธิบาย routes.ts ละเอียด [`docs/routes-explained.md`](docs/routes-explained.md) · ตั้งค่า Supabase+Google [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)

## คำสั่ง

```bash
npm run dev      # dev server (Turbopack) → http://localhost:3000
npm run build    # production build (ตรวจ type ทั้งโปรเจ็ค)
npm run start    # รัน production build
npm run lint     # next lint
```

- ไม่มี test runner — "ตรวจว่าพัง/ไม่พัง" ใช้ `npm run build` (คอมไพล์ TypeScript ทั้งหมด) หรือดู dev log
- **`.env.local`** (ไม่ขึ้น git) ต้องมี: `ORS_API_KEY` (เส้นทางเกาะถนน) + `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (auth/cloud) — ถ้าไม่ใส่ Supabase แอพยังรันได้ในโหมด local (ดู Persistence)

## Stack (เวอร์ชันล่าสุด — ตั้งใจ pin ใหม่)

Next.js 16 (App Router) · React 19 · TypeScript 6 · **Tailwind v4 (CSS-first)** · react-leaflet 5 + leaflet 1.9.4 · zustand 5 · **@supabase/supabase-js + @supabase/ssr** (auth/db) · **html5-qrcode** (สแกน) · **qrcode** (สร้าง QR ทดสอบ)

- **Tailwind v4 ไม่มี `tailwind.config.ts`** — ธีมอยู่ในบล็อก `@theme` ของ [src/app/globals.css](src/app/globals.css), PostCSS ใช้ `@tailwindcss/postcss`
- **Next 16**: `params` เป็น `Promise` — หน้า dynamic ต้อง unwrap ด้วย `use(params)`; `cookies()` ก็เป็น async (`await cookies()` ใน server client)

## สถาปัตยกรรมหลัก (อ่านก่อนแก้)

### ชั้นข้อมูล: หมุดคือแหล่งความจริงเดียว
- [data/checkpoints.ts](src/data/checkpoints.ts) เก็บ `coord: [lat,lng]` จริงของหมุดมรดกทั้ง ๑๐ จุด **ที่เดียว** + `points` (แต้ม) + `emoji` (หน้าเหรียญ) + `fact`
- **`CheckpointId`** (union ของ id หมุดทั้งหมด) นิยามใน [types.ts](src/types.ts) ใช้กับ `Checkpoint.id` และ `RouteDef.checkpointIds` → พิมพ์ id ผิด TS ฟ้องตั้งแต่ compile + บังคับ sync กับ CHECKPOINTS (เพิ่มหมุดต้องเพิ่มใน union)
- [data/routes.ts](src/data/routes.ts) นิยามเส้นทาง Basic ด้วย factory `basic({...})` รับแค่ `checkpointIds` แล้ว **derive `path` + `distanceKm` + `legCalories` + `kind` อัตโนมัติ** — อย่าพิมพ์ `path` มือ (override ได้)
- **แคลอรี่เป็นค่าต่อช่วง (leg)** เก็บใน `legCalories: number[]` (ยาว = จำนวนหมุด − 1) เช็คอินถึงหมุดที่ N → ได้ `legCalories[N-1]` · ไม่กรอก = คิดจากระยะ (`legCaloriesFromPath` ใน geo.ts) · Advance ใช้ fallback นี้

### เส้นทางเกาะถนนจริง (OpenRouteService)
- `route.path` เป็นแค่เส้นตรงเชื่อมหมุด → "ดัด" ให้เกาะถนนผ่าน ORS **Directions V2 (`foot-walking`)**
- Flow: หน้าวิ่ง → [lib/snapToRoads.ts](src/lib/snapToRoads.ts) (cache + fallback เส้นตรงถ้าล่ม) → POST `/api/route` ([app/api/route/route.ts](src/app/api/route/route.ts)) แนบ key ฝั่ง server → ORS
- **`ORS_API_KEY` อยู่ฝั่ง server เท่านั้น** · ORS ใช้ `[lng,lat]` แต่ทั้งแอพใช้ `[lat,lng]` แบบ Leaflet — route handler แปลงให้

### Auth: Supabase + Google login
- [lib/supabase/client.ts](src/lib/supabase/client.ts) — browser client **memoize เป็น singleton** (กัน "Multiple GoTrueClient") + `isSupabaseConfigured` (เช็ก env)
- [lib/supabase/server.ts](src/lib/supabase/server.ts) — server client ผูก cookie · [middleware.ts](middleware.ts) — รีเฟรช session ทุก request (ข้ามถ้าไม่ตั้ง env)
- Flow: [/login](src/app/login/page.tsx) (`signInWithOAuth` google) → [/auth/callback](src/app/auth/callback/route.ts) (`exchangeCodeForSession` → ถ้าโปรไฟล์ไม่ครบเด้ง [/onboarding](src/app/onboarding/page.tsx)) → กรอกชื่อ/นามสกุล/วันเกิด เก็บตาราง `profiles` · แก้โปรไฟล์ที่ [/profile](src/app/profile/page.tsx) (คำนวณอายุจาก dob)
- [lib/useUser.ts](src/lib/useUser.ts) hook อ่าน session ฝั่ง client · [AuthButton](src/components/AuthButton.tsx) บน masthead
- **Soft gating**: ดูหน้าแรก/เส้นทางได้เลย — แต่ **เริ่มวิ่ง / สแกน QR / โปรไฟล์** ต้อง login ก่อน (เฉพาะเมื่อ `isSupabaseConfigured`)

### ข้อมูลผู้ใช้: RunRepository (async) → Supabase หรือ Local
- [lib/storage.ts](src/lib/storage.ts): `interface RunRepository` (เมธอด **async** คืน Promise) — `getRuns / addRun / totalPoints / getAchievements / unlockAchievement` + `saveDraftRoute / getDraftRoute` (เก็บ local sync, ส่งต่อ build→run)
- เลือก implementation ตอน import: **`isSupabaseConfigured ? SupabaseRepo : LocalRepo`** → ตั้งค่า Supabase แล้วใช้ cloud (ต่อ user), ยังไม่ตั้ง = localStorage (เดโมรันได้ก่อน setup)
- ตาราง Supabase: `profiles` / `runs` / `achievements` + **RLS ต่อ user** (สร้างด้วย [supabase/schema.sql](supabase/schema.sql))
- SupabaseRepo **กรอง `.eq("user_id", uid)` เอง** (ไม่พึ่ง RLS อย่างเดียว) · `unlockAchievement` ใช้ `upsert({ignoreDuplicates})` ไม่พึ่งรหัส error
- ⚠️ anon key เป็น **public ได้** (ออกแบบมาแบบนั้น) — ความปลอดภัยจริงคือ RLS; ห้ามเอา `service_role` key มาใส่ `NEXT_PUBLIC_`

### State การวิ่ง: zustand store
- [store/runStore.ts](src/store/runStore.ts) เก็บ status/trace/distance/points/calories/checkedIn ฯลฯ
- **`pushPosition(coord)` คือหัวใจ** — ทุกตำแหน่งใหม่ (sim/GPS): กรอง noise (jump > `GPS_JUMP_MAX_M` 200ม. = ทิ้ง) → บวกระยะ (Haversine) → ต่อ trace → check-in (หมุดที่ index `i` < `CHECKIN_RADIUS_M` 45ม. → +`points` + แคลของช่วง `route.legCalories?.[i-1]` + toast)
- 2 โหมดเข้าฟังก์ชันเดียวกัน: **sim** = `densify(route.path)` step ทุก 180ms / **gps** = `watchPosition`
- หน้าวิ่ง [run/[routeId]/page.tsx](src/app/run/[routeId]/page.tsx) เซฟผลตอนจบผ่าน `repo.addRun()` — ถ้าพลาดมี **ปุ่มลองใหม่** (ไม่หายเงียบ)

### QR + Achievements (เหรียญสถานที่)
- [components/ScanOverlay.tsx](src/components/ScanOverlay.tsx) — scanner ใช้ซ้ำได้ (prop `modal`: เต็มจอ=หน้า /scan, การ์ดกลางจอ=ปุ่มในหน้าวิ่ง); อ่าน QR payload **`rk:cp:<checkpointId>`** → `repo.unlockAchievement(id)`
- กล้องใช้ **serialize teardown** (รอ stop รอบก่อนเสร็จก่อน start ใหม่) + `cancelled` guard — กันชนกันตอนสลับกล้องหน้า/หลัง/remount
- [/scan](src/app/scan/page.tsx) (gate login) · [/scan/codes](src/app/scan/codes/page.tsx) (สร้าง QR ทุกจุดด้วย `qrcode` ไว้ทดสอบ) · [/achievements](src/app/achievements/page.tsx) (เหรียญ ๑๐ ใบ derive จาก CHECKPOINTS)

### แผนที่
- [components/RunMap.tsx](src/components/RunMap.tsx) client-only — **dynamic import `ssr: false`** (Leaflet อ้าง `window`)
- วาด: เส้นทางควรวิ่ง (ชาดแดง ประ) + ลูกศรทิศทาง (divIcon หมุนตาม bearing) + trace จริง (น้ำเงิน) + หมุด (จุดแรก=เริ่ม, สุดท้าย=เส้นชัย, เช็คอินแล้ว=✓)

## ธีม UI "YOUNG vibes" (ม่วง/เหลือง — รีดีไซน์ มิ.ย. 2026)
- **Dark theme** (`color-scheme: dark`): พื้นม่วงเข้ม `--color-bg` `#3b1a4e` + ส้มสด CTA `--color-accent` `#f44e03` + เหลืองสด `--color-accent2` `#ffe956` + ครีม `--color-cream` (sunburst/การ์ดสว่าง) + ลาเวนเดอร์ `--color-chip` + ขาวนวล `--color-ink` — token ทั้งหมดใน `@theme` ของ [globals.css](src/app/globals.css)
- ฟอนต์ **next/font** ([layout.tsx](src/app/layout.tsx)): **Kanit** (display, `font-display`) + **Fredoka** (`font-brand`, wordmark "young vibes") + **Sarabun** (body, `font-sans`)
- คลาส decorative ยังใช้ต่อ: `.kicker` `.rule-double` `.card-paper` `.hatch` `.rise` `.livedot` `.chip` · ใช้เลขไทยใน UI เชิงตกแต่ง
- **คอมโพเนนต์ธีมใช้ซ้ำ**: [Sunburst.tsx](src/components/Sunburst.tsx) (วงแฉกครีม ใส่ emoji กลาง) · [Medal.tsx](src/components/Medal.tsx) (sunburst + ริบบิ้น, optional วงใน) · [RoadBg.tsx](src/components/RoadBg.tsx) (ถนนคดเคี้ยวพื้นหลัง — วางในพาเรนต์ `relative isolate` ใช้ `-z-10`) · [Mascot.tsx](src/components/Mascot.tsx) (นักวิ่ง — **placeholder SVG**, สลับเป็นอาร์ตจริงถ้าทีมมีให้)
- **Gotcha**: `Sunburst`/`Medal` ตั้ง `position: relative` ที่ root — **อย่าส่ง utility `absolute`/positioning เข้าไปตรง ๆ** (จะตีกันทำ layout พัง) ให้ครอบด้วย `<span>` ที่ positioned แทน
- **Design source of truth**: PNG ใน `Young(keep)Vibes/` (export จาก Canva ของทีม) — เสร็จจริงแค่ home/routes/build; หน้าอื่น extrapolate ตามธีม ถ้าทีมเพิ่มสกรีนให้ match ตาม

## การ์ดสรุปผล (recap share card)
- จบวิ่ง → [SummaryModal](src/components/SummaryModal.tsx) สรุปผล → เปิด [RecapShareModal](src/components/RecapShareModal.tsx) (พรีวิว/เซฟ/แชร์) — เรียกจาก [run/[routeId]/page.tsx](src/app/run/[routeId]/page.tsx); recap data gate ตอนเปิด modal เท่านั้น
- [lib/recapCard.ts](src/lib/recapCard.ts) — **โมดูล canvas draw บริสุทธิ์** วาดการ์ด 1080×1920 (Layout B): สถิติ + polyline ของ trace จริง (degenerate trace → จุดกลางการ์ด) · รับ `RecapData` ที่ format ค่ามาแล้ว
- [lib/notoSansThai.ts](src/lib/notoSansThai.ts) — โหลด **Noto Sans Thai** ฝั่ง client (มี retry ตอนโหลดไม่ครบ) ใช้ทั้ง recap card และ [opengraph-image.tsx](src/app/opengraph-image.tsx) (OG ใช้ `NOTO_FAMILY`, ไม่ใส่ letter-spacing ไทย)

## ข้อควรระวัง (gotcha ที่เคยเจอ)
- **react-leaflet + html5-qrcode พังกับ React StrictMode double-mount (dev)** → `Map container is being reused`, camera `AbortError` · แก้โดย `reactStrictMode: false` ใน [next.config.mjs](next.config.mjs) (มีผลแค่ dev) — โค้ดกล้อง/แผนที่ก็ป้องกัน double-mount ไว้ระดับนึงแล้ว
- **callback ที่ส่งให้ component re-render ถี่ ต้องเก็บใน `ref`** ไม่งั้น `setTimeout` ใน effect ถูกรีเซ็ตทุก frame (ดู [CheckinToast.tsx](src/components/CheckinToast.tsx))
- **Supabase client memoize เป็น singleton** — อย่ากลับไปสร้างใหม่ทุก call (จะเตือน Multiple GoTrueClient)
- กล้อง + GPS จริงบนมือถือ **ต้อง HTTPS** (localhost ยกเว้น) — เดโมผ่าน cloudflared tunnel
- `next-env.d.ts` / `tsconfig.json` ถูก Next แก้อัตโนมัติตอน build — อย่า revert
