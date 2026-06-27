"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // เติมชื่อจาก Google ถ้ามี + กันคนไม่ได้ login เข้ามาตรง ๆ
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const full = (user.user_metadata?.full_name as string | undefined)?.trim();
      if (full) {
        const [first, ...rest] = full.split(" ");
        setFirstName((v) => v || first);
        setLastName((v) => v || rest.join(" "));
      }
      setReady(true);
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dob) return;
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dob,
    });
    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
      setBusy(false);
      return;
    }
    router.replace(next);
  };

  if (!ready) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-center px-7 py-10">
      <div className="kicker text-[11px] text-accent2">ยินดีต้อนรับ</div>
      <h1 className="mt-3 font-display text-3xl leading-tight">ตั้งค่าโปรไฟล์</h1>
      <p className="mt-2 text-sm text-muted">กรอกข้อมูลเพื่อเริ่มสะสมแต้มและเหรียญสถานที่</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-muted">ชื่อ</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">นามสกุล</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">วันเดือนปีเกิด</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-accent p-3.5 font-bold text-cream active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "กำลังบันทึก…" : "เริ่มใช้งาน →"}
        </button>
      </form>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
