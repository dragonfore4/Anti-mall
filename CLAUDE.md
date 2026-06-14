# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

โปรเจ็คจริง (Next.js) ของ "วิ่งรอบเกาะรัตนโกสินทร์" — เว็บแอพวิ่งเชิงท่องเที่ยววัฒนธรรม รวม GPS tracking + เกมสะสมแต้ม + เกร็ดความรู้มรดก ดูคอนเซ็ปต์/ฟีเจอร์ภาพรวมที่ `../CLAUDE.md` (ราก) ไฟล์นี้เน้นสถาปัตยกรรมของโค้ดจริงในโฟลเดอร์ `web/`

## คำสั่ง

```bash
npm run dev      # dev server (Turbopack) → http://localhost:3000
npm run build    # production build (ตรวจ type ทั้งโปรเจ็ค)
npm run start    # รัน production build
npm run lint     # next lint
```

ไม่มี test runner ในโปรเจ็คนี้ การ "ตรวจว่าพัง/ไม่พัง" ใช้ `npm run build` (คอมไพล์ TypeScript ทั้งหมด) หรือดู dev log

## Stack (เวอร์ชันล่าสุด — ตั้งใจ pin ใหม่)

Next.js 16 (App Router) · React 19 · TypeScript 6 · **Tailwind v4 (CSS-first)** · react-leaflet 5 + leaflet 1.9.4 · zustand 5

- **Tailwind v4 ไม่มี `tailwind.config.ts`** — ธีมอยู่ในบล็อก `@theme` ของ [src/app/globals.css](src/app/globals.css) ทั้งหมด, PostCSS ใช้ `@tailwindcss/postcss`
- **Next 16**: `params` เป็น `Promise` — หน้า dynamic ต้อง unwrap ด้วย `use(params)` (ดู [run/[routeId]/page.tsx](src/app/run/[routeId]/page.tsx))

## สถาปัตยกรรมหลัก (อ่านก่อนแก้)

### ชั้นข้อมูล: หมุดคือแหล่งความจริงเดียว
- [data/checkpoints.ts](src/data/checkpoints.ts) เก็บพิกัด `ll: [lat,lng]` จริงของหมุดมรดกทั้ง ๙ จุด **ที่เดียว** + แต้ม/เกร็ดความรู้
- [data/routes.ts](src/data/routes.ts) นิยามเส้นทาง Basic ด้วย factory `basic({...})` ที่รับแค่ `checkpointIds` แล้ว **derive `path` + `distanceKm` + `legCal` อัตโนมัติ** ผ่าน `checkpointPath()` — อย่าพิมพ์พิกัด `path` มือ (ใส่ override ได้ถ้าจำเป็น)
- **แคลอรี่เป็นค่าต่อช่วง (leg)** เก็บใน `legCal: number[]` ของแต่ละเส้นทาง (ยาว = จำนวนหมุด − 1) เช็คอินถึงหมุดที่ N → ได้แคลของช่วง N-1→N · ไม่ใส่ `legCal` = คิดจากระยะให้ (`legCaloriesFromPath` ใน geo.ts) · Advance ใช้ fallback นี้เสมอ
- ผลลัพธ์: `route.path` = พิกัดหมุดเรียงตามลำดับเสมอ ทั้ง Basic และ Advance ([routeGen.ts](src/lib/routeGen.ts) ก็ map checkpoint → ll เหมือนกัน)

### เส้นทางเกาะถนนจริง (OpenRouteService)
- `route.path` เป็นแค่เส้นตรงเชื่อมหมุด → ต้อง "ดัด" ให้เกาะถนนผ่าน ORS **Directions V2 (`foot-walking`)**
- Flow: หน้าวิ่ง → [lib/snapToRoads.ts](src/lib/snapToRoads.ts) (มี cache + fallback เส้นตรงถ้าล่ม) → POST `/api/route` ([app/api/route/route.ts](src/app/api/route/route.ts)) ที่แนบ key ฝั่ง server → ORS
- **`ORS_API_KEY` อยู่ใน `.env.local` ฝั่ง server เท่านั้น** ห้ามยิง ORS จาก client ตรง ๆ (key หลุด)
- ORS ใช้ลำดับ `[lng,lat]` แต่ทั้งแอพใช้ `[lat,lng]` แบบ Leaflet — route handler แปลงกลับให้

### State การวิ่ง: zustand store
- [store/runStore.ts](src/store/runStore.ts) เก็บ status/trace/distance/points/checkedIn ฯลฯ
- **`pushPosition()` คือหัวใจ** — ทุกตำแหน่งใหม่ (จาก sim หรือ GPS) เข้าฟังก์ชันนี้: กรอง noise (ทิ้ง jump > `GPS_JUMP_MAX_M` 200ม.) → บวกระยะ (Haversine) → ต่อ trace → ตรวจ check-in (เข้าใกล้หมุดที่ index `i` < `CHECKIN_RADIUS_M` 45ม. → +แต้ม + แคลของช่วง `route.legCal[i-1]` + เด้ง toast)
- 2 โหมดป้อนตำแหน่งเข้าฟังก์ชันเดียวกัน: **sim** = `densify(route.path)` แล้ว step ทุก 180ms / **gps** = `watchPosition`
- ค่าคงที่ (ความยาวก้าว, รัศมีเช็คอิน, เกณฑ์กรอง GPS) อยู่ [lib/stats.ts](src/lib/stats.ts); geo math (Haversine/densify/metersToKm/legCaloriesFromPath/centroid) อยู่ [lib/geo.ts](src/lib/geo.ts) — แคลอรี่ไม่ใช้สูตร MET แล้ว (ดูชั้นข้อมูลด้านบน)

### Persistence: สลับ backend ได้
- [lib/storage.ts](src/lib/storage.ts) เป็น `RunRepository` interface ปัจจุบัน `LocalRepo` (localStorage) — **ออกแบบให้สลับเป็น Supabase ได้โดยไม่แตะหน้าเว็บ** (มีคอมเมนต์จุดเสียบ) ทุกการอ่าน/เขียน localStorage มี guard `typeof window` ให้ SSR ผ่าน

### แผนที่
- [components/RunMap.tsx](src/components/RunMap.tsx) เป็น client-only — หน้าวิ่ง **dynamic import ด้วย `ssr: false`** เพราะ Leaflet อ้าง `window`
- วาด 4 ชั้น: เส้นทางที่ควรวิ่ง (ชาดแดง ประ) + ลูกศรทิศทาง (divIcon หมุนตาม bearing) + trace ที่วิ่งจริง (น้ำเงิน) + หมุด (จุดแรก=เริ่ม, สุดท้าย=เส้นชัย, เช็คอินแล้ว=✓)

## ธีม UI "กระดาษสา" (นิตยสารมรดก)
- Light theme: พื้นกระดาษครีม + ชาดแดง (`--color-accent`) + ทองอ่อน (`--color-accent2`) + หมึกดำ (`--color-ink`) — token ทั้งหมดใน `@theme` ของ globals.css (utility เช่น `bg-card`, `text-accent`, `text-ink`, `border-line`)
- ฟอนต์โหลดด้วย **next/font** ใน [layout.tsx](src/app/layout.tsx): **Chonburi** (display, `font-display`) + **Sarabun** (body, `font-sans`) ผูกผ่าน CSS var
- คลาส decorative ใช้ซ้ำ: `.kicker` `.rule-double` `.card-paper` `.hatch` `.rise` (staggered reveal) `.livedot`
- ใช้เลขไทย (๐๑/๐๒) ใน UI เชิงตกแต่งเป็นเอกลักษณ์

## ข้อควรระวัง (gotcha ที่เคยเจอ)
- **callback ที่ส่งให้ component ที่ re-render ถี่** (เช่น ตอนวิ่ง) ต้องเก็บใน `ref` ไม่งั้น effect ที่ตั้ง timer จะถูกรีเซ็ตทุก frame — ดู pattern ใน [components/CheckinToast.tsx](src/components/CheckinToast.tsx)
- ใน dev จะเห็น `POST /api/route` ยิง 2 ครั้งต่อการเข้าหน้า = React StrictMode (effect ซ้ำ) ตอน build จริงยิงครั้งเดียว
- ลินเตอร์เตือน `bg-gradient-to-br` → `bg-linear-to-br` เป็นแค่ alias เดิม (v4 ยังใช้ได้) คงไว้ให้เหมือนทั้งโปรเจ็คได้
- `next-env.d.ts` / `tsconfig.json` ถูก Next แก้อัตโนมัติตอน build — อย่า revert
