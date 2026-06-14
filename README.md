# วิ่งรอบเกาะรัตนโกสินทร์ — คู่มือ Maintainer

เว็บแอพวิ่งเชิงท่องเที่ยววัฒนธรรม: **GPS tracking + เกมสะสมแต้ม + เกร็ดความรู้มรดก** วิ่งตามรอยวัด วัง ป้อม ในเมืองเก่ากรุงเทพฯ พร้อมเช็คอินสะสมแต้ม/แคลอรี่

> เอกสารนี้เขียนสำหรับ "คนที่ต้องมาดูแลโค้ดต่อ" — บอกว่าควร **เริ่มอ่านฟังก์ชันไหนก่อน** และระบบต่อกันยังไง
> (มีฉบับ HTML เปิดในเบราว์เซอร์ที่ [`docs/maintainer-guide.html`](docs/maintainer-guide.html))

---

## รันยังไง

```bash
npm install
npm run dev      # http://localhost:3000  (Turbopack)
npm run build    # production build = ตรวจ type ทั้งโปรเจ็ค (ใช้แทน test)
npm run start    # รัน production
npm run lint
```

**ต้องมีไฟล์ `.env.local`** (ไม่ขึ้น git) ใส่ ORS API key:
```
ORS_API_KEY=<key จาก openrouteservice.org/dev>
```
ไม่มี key ก็รันได้ — เส้นทางจะ fallback เป็นเส้นตรง (ไม่เกาะถนน)

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind v4 (CSS-first, ไม่มีไฟล์ config) · react-leaflet 5 · zustand 5

---

## ภาพรวมระบบ (data flow)

```
data/checkpoints.ts          เลือกเส้นทาง           กดเริ่มวิ่ง
 (พิกัด+แต้ม)       ──┐      (Basic/Advance)            │
                      │             │                   ▼
data/routes.ts ───────┤             ▼            ┌──────────────┐
 basic() derive path  └──►  run/[routeId]/page  │ ลูป sim/gps   │
                            │  snapToRoads()     │ ป้อนพิกัด     │
                            │     │              └──────┬───────┘
                            │     ▼ /api/route          ▼
                            │   ORS (เกาะถนน)    store.pushPosition()
                            │                    กรอง noise+นับระยะ
                            ▼                    +เช็คอิน(+แต้ม+แคล)
                          RunMap วาดแผนที่              │
                                                       ▼
                                                  finish → repo.addRun()
                                                  (localStorage)
```

---

## 🧭 เริ่มอ่านโค้ดจากตรงนี้ (เรียงลำดับ)

อ่านตาม 8 สเต็ปนี้แล้วจะเข้าใจทั้งระบบ — แต่ละอันบอกว่า **ทำไมสำคัญ** และ **ดูอะไร**

### 1. `src/types.ts` — รูปร่างข้อมูลทั้งหมด
เริ่มที่นี่เสมอ ดู 3 interface หลัก: `Checkpoint` (หมุด), `RouteDef` (เส้นทาง), `RunRecord` (ผลการวิ่งที่เซฟ) เข้าใจ field พวกนี้แล้วที่เหลือจะตามง่าย

### 2. `src/data/checkpoints.ts` — แหล่งความจริงเดียวของหมุด ⭐
`CHECKPOINTS` คือ array ของจุดมรดก ๑๐ จุด แต่ละจุดมี `ll: [lat,lng]`, `pts` (แต้ม), `fact` (เกร็ดความรู้)
**พิกัด/แต้ม อยู่ที่นี่ที่เดียว** — แก้ที่นี่แล้วทุกเส้นทางอัปเดตตาม (แคลอรี่ย้ายไปเป็นค่า "ต่อช่วง" ใน routes.ts — ดูข้อ 3)

### 3. `src/data/routes.ts` — นิยามเส้นทาง Basic
ดู 2 ฟังก์ชัน:
- **`checkpointPath(ids)`** — แปลง id หมุด → พิกัดเรียงกัน (เส้นทางเริ่มต้น)
- **`basic(spec)`** — factory: รับแค่ `checkpointIds` แล้ว **เติม `path` + `distanceKm` + `legCal` ให้อัตโนมัติ** เพิ่มเส้นทางใหม่แค่ก๊อป block แล้วใส่ id หมุด ไม่ต้องพิมพ์พิกัดเอง
- **`legCal: number[]`** = แคลอรี่ **ต่อช่วง** (leg) ยาว = จำนวนหมุด − 1 เช่น `[90, 70, 130]` คือช่วง ๑→๒ ได้ 90, ๒→๓ ได้ 70, ๓→๔ ได้ 130 · กรอกเองในแต่ละ route หรือเว้นไว้ให้คิดจากระยะ (`legCaloriesFromPath`)

### 4. `src/store/runStore.ts` — `pushPosition()` คือหัวใจ ⭐⭐⭐
**ฟังก์ชันสำคัญที่สุดในโปรเจ็ค** เรียกทุกครั้งที่ได้ตำแหน่งใหม่ (จาก sim หรือ GPS) ทำ 4 อย่างเรียงกัน:
1. **กรอง noise** — ถ้าตำแหน่งกระโดด > 200ม. (`GPS_JUMP_MAX_M`) ทิ้ง (GPS เพี้ยน)
2. **บวกระยะทาง** (Haversine)
3. **ต่อ trace** (เส้นน้ำเงินที่วิ่งจริง)
4. **เช็คอิน** — วน checkpointIds ถ้าเข้าใกล้หมุดที่ index `i` < 45ม. (`CHECKIN_RADIUS_M`) และยังไม่เคยเช็คอิน → บวกแต้ม + บวกแคลของช่วงที่เพิ่งวิ่งมา (`route.legCal[i-1]`, จุดเริ่ม = 0) + เด้ง toast

action อื่น: `begin/tick/finish/reset` ตรงไปตรงมา (`tick` แค่อัปเดตเวลา)

### 5. `src/app/run/[routeId]/page.tsx` — ตัวประสานงาน (orchestrator)
หน้าวิ่งจริง รวมทุกอย่างเข้าด้วยกันผ่าน `useEffect` 4 ตัว:
1. **หา route + ดัดเส้นเกาะถนน** — โหลด route แล้วเรียก `snapToRoads()` (โชว์เส้นตรงก่อน → อัปเกรดเป็นเส้นเกาะถนนเมื่อ ORS ตอบ)
2. **ลูปติดตามตำแหน่ง** — sim: `setInterval` ป้อน `densify(path)` ทุก 180ms / gps: `watchPosition` + `tick` ทุก 500ms
3. **เซฟตอนจบ** — `repo.addRun()` ครั้งเดียว (กันซ้ำด้วย `savedRef`)
4. **reset ตอนออกจากหน้า**

### 6. `src/lib/snapToRoads.ts` + `src/app/api/route/route.ts` — เส้นเกาะถนน (ORS)
- `snapToRoads(points)` (client) — POST ไป `/api/route`, มี **cache** + **fallback เส้นตรง** ถ้าล่ม
- `route.ts` (server) — proxy เรียก ORS `foot-walking`, **เก็บ API key ฝั่ง server เท่านั้น**, แปลงพิกัด `[lat,lng]`↔`[lng,lat]`

### 7. `src/lib/geo.ts` + `src/lib/stats.ts` — คณิตศาสตร์/ค่าคงที่
- `geo.ts`: `distanceM` (Haversine), `pathLengthM`, `densify` (แตกจุดถี่ให้ sim ลื่น), `metersToKm`, `legCaloriesFromPath` (แคลต่อช่วงแบบคิดจากระยะ), `centroid`
- `stats.ts`: `steps(distanceM)` (ประมาณก้าว = ระยะ ÷ 0.75ม.), `fmtTime`, ค่าคงที่ `CHECKIN_RADIUS_M` / `GPS_JUMP_MAX_M`
> หมายเหตุ: **แคลอรี่ไม่ใช้สูตร MET แล้ว** — เป็นค่า **ต่อช่วง** กำหนดใน `legCal` ของแต่ละเส้นทาง (routes.ts) บวกสะสมตอนเช็คอินใน store

### 8. `src/lib/routeGen.ts` — โหมด Advance (สร้างเส้นทางเอง)
อ่าน top-down: `pickCheckpoints()` (คัดจุดตามย่าน/มรดก) → `orderByNearestNeighbour()` (เรียงให้ต่อเนื่อง) → `generateAdvanceRoute()` ประกอบเป็น `RouteDef`

### (เสริม) `src/components/RunMap.tsx` · `src/lib/storage.ts`
- `RunMap` — วาดแผนที่ (client-only, dynamic import): เส้นทาง + ลูกศรทิศทาง + trace + หมุด (เริ่ม/เส้นชัย/เช็คอินแล้ว)
- `storage.ts` — `RunRepository` interface + `LocalRepo` (localStorage) **ออกแบบให้สลับเป็น Supabase ได้โดยไม่แตะหน้าเว็บ**

---

## 🔧 งาน maintain ที่เจอบ่อย

| อยากทำ | แก้ที่ |
|---|---|
| เพิ่ม/แก้หมุด หรือเปลี่ยนพิกัด/แต้ม/เกร็ดความรู้ | [`data/checkpoints.ts`](src/data/checkpoints.ts) — เพิ่ม object ใน `CHECKPOINTS` |
| เปลี่ยนแคลอรี่ต่อช่วง (leg) | [`data/routes.ts`](src/data/routes.ts) — แก้ array `legCal` ของเส้นทางนั้น |
| เพิ่มเส้นทาง Basic | [`data/routes.ts`](src/data/routes.ts) — ก๊อป `basic({...})` ใส่ id หมุด + `legCal` (หรือเว้นให้คิดจากระยะ) |
| ปรับรัศมีเช็คอิน / เกณฑ์กรอง GPS | [`lib/stats.ts`](src/lib/stats.ts) — `CHECKIN_RADIUS_M`, `GPS_JUMP_MAX_M` |
| เปลี่ยนความยาวก้าวที่ใช้ประมาณ | [`lib/stats.ts`](src/lib/stats.ts) — `STEP_LEN_M` |
| เปลี่ยน base map / สีเส้นทาง | [`components/RunMap.tsx`](src/components/RunMap.tsx) — `TileLayer` url / `Polyline` |
| เปลี่ยนโปรไฟล์ routing (เดิน→ปั่น) | [`app/api/route/route.ts`](src/app/api/route/route.ts) — `foot-walking` |
| ปรับธีม/สี/ฟอนต์ | [`app/globals.css`](src/app/globals.css) — บล็อก `@theme` |
| ต่อ backend จริง | เขียน `SupabaseRepo implements RunRepository` แล้วสลับ `repo` ใน [`lib/storage.ts`](src/lib/storage.ts) |

---

## ⚠️ Gotchas (เคยเจอจริง)

- **callback ที่ส่งให้ component ที่ re-render ถี่ ต้องเก็บใน `ref`** ไม่งั้น `setTimeout` ใน effect จะถูกรีเซ็ตทุก frame (ดู [`CheckinToast.tsx`](src/components/CheckinToast.tsx) — toast เคยปิดไม่ได้เพราะเหตุนี้)
- **ใน dev เห็น `POST /api/route` ยิง 2 ครั้ง/หน้า** = React StrictMode เรียก effect ซ้ำ — production ยิงครั้งเดียว
- **Next 16: `params` เป็น Promise** ต้อง unwrap ด้วย `use(params)`
- **Leaflet ต้องโหลด client-only** — `RunMap` import แบบ `dynamic(..., { ssr: false })`
- **GPS จริงบนมือถือต้องใช้ HTTPS** (localhost ยกเว้น) — เดโมผ่าน LAN IP ใช้โหมดจำลองแทน
- ลินเตอร์ Tailwind v4 เตือน `bg-gradient-to-br`→`bg-linear-to-br` เป็นแค่ alias เดิม ใช้ได้

---

## 📁 แผนผังไฟล์

```
src/
├── app/
│   ├── page.tsx                 หน้าแรก (hero + เปรียบเทียบ + โหมด + แต้ม)
│   ├── routes/                  เลือกเส้นทาง Basic
│   ├── build/                   โหมด Advance (เลือกย่าน→มรดก→บรรยากาศ)
│   ├── run/[routeId]/           ★ หน้าวิ่ง (orchestrator)
│   ├── history/ · rewards/      ประวัติ · แต้ม/เหรียญ
│   ├── api/route/               proxy ORS (server)
│   ├── layout.tsx · globals.css ฟอนต์ + ธีม
├── components/                  RunMap · CheckinToast · StatsBar · SummaryModal · RouteCard · HeroStats
├── data/                        checkpoints ⭐ · routes · options · rewards
├── lib/                         geo · stats · routeGen · snapToRoads · storage · useWakeLock
├── store/runStore.ts            ★ state การวิ่ง (pushPosition)
└── types.ts                     รูปร่างข้อมูล
```

⭐ = จุดที่ควรอ่าน/ระวังที่สุด
