# Design: Google Login + โปรไฟล์ + QR Achievements

วันที่: 2026-06-14 · สถานะ: อนุมัติแล้ว (พร้อมทำ)

## เป้าหมาย

เพิ่ม 3 ฟีเจอร์เข้าแอพ "วิ่งรอบเกาะรัตนโกสินทร์":
1. **Login with Google** (Supabase Auth) + เก็บโปรไฟล์ผู้ใช้ (ชื่อ, นามสกุล, วันเดือนปีเกิด)
2. **ย้ายข้อมูลขึ้น Supabase** (cloud, ต่อ user) — runs / แต้ม / achievements / profile
3. **QR scan → ปลดล็อกเหรียญสถานที่** (achievement ต่อหมุด)

## การตัดสินใจหลัก (จาก brainstorming)

| ประเด็น | เลือก |
|---|---|
| วิธี Login | Supabase Auth + Google OAuth จริง |
| ขอบเขตข้อมูล cloud | ย้ายทุกอย่างขึ้น Supabase (runs/แต้ม/achievement/profile) |
| โมเดล QR | QR ต่อหมุด → ปลดล็อกเหรียญของจุดนั้น (1 หมุด = 1 เหรียญ) ใช้ CHECKPOINTS เดิม |
| Login gating | Soft — ดูหน้าแรก/เส้นทางได้เลย, ต้อง login เฉพาะตอนวิ่ง/เก็บข้อมูล/สแกน/ดู achievement |

## Prerequisites (ผู้ใช้ตั้งเอง — นอกโค้ด)

1. สร้าง Supabase project → Project URL + anon key
2. Google Cloud: สร้าง OAuth client → ใส่ client id/secret ใน Supabase (Authentication → Providers → Google) + ตั้ง redirect URL ของ Supabase
3. รัน SQL (เตรียมไว้ใน `supabase/schema.sql`) สร้างตาราง + RLS + trigger สร้าง profile
4. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - มีคู่มือ step-by-step ที่ `docs/SUPABASE_SETUP.md`

## Dependencies ใหม่ (เวอร์ชันล่าสุด)

`@supabase/supabase-js@2.108.1` · `@supabase/ssr@0.12.0` · `html5-qrcode@2.3.8` · `qrcode@1.5.4`

## สถาปัตยกรรม

### ชั้น Auth
- `lib/supabase/client.ts` — browser client (`createBrowserClient` จาก @supabase/ssr)
- `lib/supabase/server.ts` — server client (อ่าน/เขียน cookie)
- `middleware.ts` — รีเฟรช session ทุก request
- `app/login/page.tsx` — ปุ่ม "เข้าสู่ระบบด้วย Google" → `signInWithOAuth({ provider: "google", options: { redirectTo: <origin>/auth/callback } })`
- `app/auth/callback/route.ts` — `exchangeCodeForSession` → ถ้าโปรไฟล์ไม่ครบ redirect `/onboarding` ไม่งั้นกลับหน้าแรก
- `lib/useUser.ts` — hook อ่าน session ฝั่ง client (subscribe `onAuthStateChange`)
- Soft gating: helper `requireLogin()` — ปุ่มวิ่ง/สแกน/achievement ถ้าไม่ login → เด้งไป `/login`

### ชั้นโปรไฟล์
- Google ให้ชื่อ/อีเมล ไม่ให้วันเกิด → `app/onboarding/page.tsx` ฟอร์ม: first_name, last_name (เติมจาก Google), dob (date) → upsert `profiles`

### ชั้นข้อมูล (Supabase)
ตาราง (+ RLS: user เห็น/แก้เฉพาะแถวตัวเอง):
- `profiles(id uuid pk = auth.uid, first_name text, last_name text, dob date, created_at)`
- `runs(id uuid pk, user_id uuid, route_name text, date_iso timestamptz, km numeric, elapsed_ms int, calories int, steps int, points int, checkins int, created_at)`
- `achievements(user_id uuid, checkpoint_id text, unlocked_at timestamptz, primary key(user_id, checkpoint_id))`

`RunRepository` interface → **async** (คืน Promise). `SupabaseRepo implements RunRepository`:
- `getRuns / addRun / totalPoints` (totalPoints = sum points ของ runs ผู้ใช้)
- `getProfile / saveProfile`
- `getAchievements / unlockAchievement(checkpointId)`
- `saveDraftRoute / getDraftRoute` — คงไว้ที่ localStorage (ชั่วคราว ส่งต่อ build→run ไม่ผูก user)
- ผลกระทบ: หน้า history/rewards/run-save/achievements ต้อง `await` (เดิม sync)

### Achievements (เหรียญสถานที่)
- แคตตาล็อก = `CHECKPOINTS` ทั้ง ๑๐ จุด — เพิ่มฟิลด์ `emoji` ต่อ checkpoint เป็นหน้าเหรียญ
- `app/achievements/page.tsx` — grid ๑๐ เหรียญ ล็อก/ปลดล็อกตามตาราง `achievements`

### QR Scan
- `app/scan/page.tsx` — html5-qrcode เปิดกล้อง
- payload: `rk:cp:<checkpointId>` (เช่น `rk:cp:giant-swing`)
- สแกนถูก → ตรวจว่าเป็น checkpoint id จริง → `repo.unlockAchievement(id)` → toast "ปลดล็อกเหรียญ: <ชื่อ> 🎉"; ถ้าปลดแล้ว → แจ้ง "ปลดล็อกไปแล้ว"
- `app/scan/codes/page.tsx` — หน้า dev สร้าง QR ของทุกจุด (lib `qrcode`) ไว้ทดสอบ
- ⚠️ กล้องบนมือถือต้อง HTTPS → cloudflared tunnel (เหมือน GPS)

## แบ่งเฟส

1. **Auth + Profile** — Supabase clients, middleware, /login, /auth/callback, /onboarding, schema.sql + คู่มือ
2. **ย้ายข้อมูล** — RunRepository เป็น async, SupabaseRepo, แก้ consumer (history/rewards/run/home)
3. **QR + Achievements** — emoji ใน checkpoints, /achievements, /scan, /scan/codes

## ความเสี่ยง / หมายเหตุ
- ต้องมี Supabase project + Google OAuth ของผู้ใช้ก่อน Phase 1 ถึงจะทดสอบ login ได้
- เปลี่ยน RunRepository เป็น async กระทบหลายหน้า (interface เดิมรองรับการสลับไว้แล้ว)
- กล้อง + GPS ต้อง HTTPS บนมือถือ
- ความถูกต้องของ achievement (กันสแกนมั่ว) — POC เชื่อ QR ตรงๆ ไม่เช็ค GPS (ตามที่เลือก)

## ออกนอกขอบเขต (ยังไม่ทำ)
- กันโกง/GPS verify ตอนสแกน · แชร์ achievement · ระบบเพื่อน/leaderboard · แก้โปรไฟล์ภายหลัง (ทำได้แต่ไม่บังคับในเฟสนี้)
