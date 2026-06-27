"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ageFromDob } from "@/lib/age";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace("/");
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace("/login?next=/profile");
        return;
      }
      setEmail(user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name,last_name,dob")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setDob(p.dob ?? "");
      }
      setReady(true);
    });
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
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
      dob: dob || null,
    });
    setSaving(false);
    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    setSaved(true);
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/");
  };

  if (!ready) {
    return <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>;
  }

  const age = ageFromDob(dob);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-app px-6 pb-12 pt-6">
      <header className="flex items-center gap-3 pb-4">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <h1 className="font-display text-xl">โปรไฟล์</h1>
      </header>

      <div className="rounded-2xl border border-line bg-gradient-to-br from-card to-card2 p-5">
        <div className="font-display text-lg">
          {firstName || "ผู้ใช้"} {lastName}
        </div>
        <div className="mt-0.5 text-xs text-muted">{email}</div>
        {age !== null && <div className="mt-1 text-xs text-accent">อายุ {age} ปี</div>}
      </div>

      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-muted">ชื่อ</span>
          <input
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setSaved(false);
            }}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">นามสกุล</span>
          <input
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setSaved(false);
            }}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">วันเดือนปีเกิด</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              setSaved(false);
            }}
            required
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-accent p-3.5 font-bold text-cream active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก…" : saved ? "บันทึกแล้ว ✓" : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </form>

      <button
        onClick={signOut}
        className="mt-8 w-full rounded-xl border border-line py-3 text-sm font-bold text-muted active:scale-[0.98]"
      >
        ออกจากระบบ
      </button>
    </main>
  );
}
