# ตั้งค่า Supabase + Google Login (ทำครั้งเดียว)

ฟีเจอร์ login/โปรไฟล์/achievement ต้องมี Supabase project ของคุณเองก่อน ทำตาม 4 ขั้นนี้

---

## 1. สร้าง Supabase project

1. ไป [supabase.com](https://supabase.com) → New project (ฟรี)
2. ตั้งชื่อ + รหัส database → รอสร้างเสร็จ ~2 นาที
3. ไป **Project Settings → API** เก็บไว้ 2 ค่า:
   - **Project URL** (เช่น `https://abcd1234.supabase.co`)
   - **anon public key** (ขึ้นต้น `eyJ...`)

## 2. สร้างตาราง + ความปลอดภัย (RLS)

1. ใน Supabase → **SQL Editor → New query**
2. เปิดไฟล์ [`supabase/schema.sql`](../supabase/schema.sql) ก๊อปทั้งหมดไปวาง → **Run**
3. ได้ตาราง `profiles`, `runs`, `achievements` พร้อม RLS

## 3. เปิด Google OAuth

**3.1 ที่ Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com))
1. สร้าง project (หรือใช้ที่มี) → **APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID** → ชนิด **Web application**
3. **Authorized redirect URIs** ใส่ค่านี้ (เอา URL จาก Supabase):
   ```
   https://<your-ref>.supabase.co/auth/v1/callback
   ```
   (ดูได้ที่ Supabase → Authentication → Providers → Google จะบอก callback URL ให้)
4. กด Create → เก็บ **Client ID** + **Client secret**

**3.2 ที่ Supabase**
1. **Authentication → Providers → Google** → เปิด (Enable)
2. วาง **Client ID** + **Client secret** → Save

> ตอนทดสอบบน localhost: Supabase รองรับ redirect กลับมา `http://localhost:3000/auth/callback` ให้เพิ่ม `http://localhost:3000` ใน **Authentication → URL Configuration → Site URL / Redirect URLs**

## 4. ใส่ key ในโปรเจ็ค

เปิดไฟล์ `.env.local` (สร้างถ้ายังไม่มี) เพิ่ม 2 บรรทัด:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

แล้ว **รีสตาร์ท** dev server (`Ctrl+C` แล้ว `npm run dev` ใหม่ — Next อ่าน env ตอนสตาร์ท)

---

## ทดสอบ

1. เปิด `http://localhost:3000` → มุมขวาบนจะมี "เข้าสู่ระบบ →"
2. กด → หน้า /login → "เข้าสู่ระบบด้วย Google" → เลือกบัญชี
3. ครั้งแรกจะเด้งไป **/onboarding** ให้กรอกชื่อ–นามสกุล–วันเกิด → เริ่มใช้งาน
4. กลับหน้าแรกจะเห็น "สวัสดี <ชื่อ>" + ปุ่มออกจากระบบ

> ⚠️ บนมือถือ (กล้อง/GPS) ต้องเปิดผ่าน HTTPS — ใช้ `cloudflared tunnel --url http://localhost:3000`
> และอย่าลืมเพิ่ม URL ของ tunnel ใน Supabase Redirect URLs ด้วย

## แก้ปัญหาที่เจอบ่อย
- **กดแล้วไม่เด้ง Google / error** → เช็ก Site URL + Redirect URLs ใน Supabase ให้ตรงกับที่เปิดอยู่
- **redirect_uri_mismatch** → URI ใน Google Cloud ต้องเป็น `https://<ref>.supabase.co/auth/v1/callback` เป๊ะ
- **login ได้แต่ไม่เด้ง onboarding** → ตาราง `profiles` ยังไม่ถูกสร้าง (รัน schema.sql ข้อ 2)
