-- ============================================================
-- วิ่งรอบเกาะรัตนโกสินทร์ — Supabase schema
-- รันใน Supabase Studio → SQL Editor → New query → วางทั้งหมด → Run
-- (รันซ้ำได้ ปลอดภัย — ใช้ if not exists / drop policy ก่อนสร้าง)
-- ============================================================

-- โปรไฟล์ผู้ใช้ (1:1 กับ auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name  text,
  dob        date,
  created_at timestamptz not null default now()
);

-- ผลการวิ่งแต่ละครั้ง
create table if not exists public.runs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  route_name text not null,
  date_iso   timestamptz not null default now(),
  km         numeric not null default 0,
  elapsed_ms bigint  not null default 0,
  calories   integer not null default 0,
  steps      integer not null default 0,
  points     integer not null default 0,
  checkins   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists runs_user_idx on public.runs (user_id, date_iso desc);

-- เหรียญสถานที่ที่ปลดล็อก (จากการสแกน QR) — 1 user ต่อ 1 หมุด ได้ครั้งเดียว
create table if not exists public.achievements (
  user_id       uuid not null references auth.users (id) on delete cascade,
  checkpoint_id text not null,
  unlocked_at   timestamptz not null default now(),
  primary key (user_id, checkpoint_id)
);

-- ============================================================
-- Row Level Security: ผู้ใช้เห็น/แก้เฉพาะข้อมูลของตัวเอง
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.runs         enable row level security;
alter table public.achievements enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own runs" on public.runs;
create policy "own runs" on public.runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own achievements" on public.achievements;
create policy "own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- สร้างแถว profile ว่างอัตโนมัติเมื่อมี user ใหม่ (จะเติมชื่อ/วันเกิดตอน onboarding)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
