"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  KeyRound,
  UserCircle,
  Vault
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandMark } from "@/components/layout/BrandMark";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locker, Profile } from "@/types/database";
import { LockerCommandButtons } from "./LockerCommandButtons";
import { StatusBadge } from "./StatusBadge";

type AccountResponse = {
  message?: string;
  profile?: Profile;
  locker?: Locker | null;
};

function formatTime(value: string | null) {
  if (!value) {
    return "Belum ada aktivitas";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function UserLockerDetailClient({ lockerId }: { lockerId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locker, setLocker] = useState<Locker | null>(null);

  useEffect(() => {
    async function loadLocker() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setError("Koneksi Supabase belum tersedia.");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const account = (await response.json()) as AccountResponse;

      if (response.status === 401) {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !account.profile) {
        setError(account.message ?? "Data akun gagal dimuat.");
        setLoading(false);
        return;
      }

      if (account.profile.role !== "user") {
        window.location.href = "/admin/dashboard";
        return;
      }

      if (!account.locker || account.locker.id !== lockerId) {
        setError("Loker ini tidak terdaftar pada akun Anda.");
        setLoading(false);
        return;
      }

      setProfile(account.profile);
      setLocker(account.locker);
      setLoading(false);
    }

    loadLocker();
  }, [lockerId]);

  if (loading) {
    return <main className="main-area">Memuat detail loker...</main>;
  }

  if (error || !locker || !profile) {
    return (
      <main className="main-area detail-page">
        <Link className="back-link" href="/user/dashboard">
          <ArrowLeft size={17} />
          Kembali
        </Link>
        <div className="auth-alert">{error || "Loker tidak ditemukan."}</div>
      </main>
    );
  }

  return (
    <main className="main-area detail-page">
      <header className="topbar">
        <div>
          <BrandMark />
          <Link className="back-link" href="/user/dashboard">
            <ArrowLeft size={17} />
            Kembali
          </Link>
          <h1>{locker.name}</h1>
          <p>Detail status dan kontrol loker milik Anda.</p>
        </div>
        <LogoutButton className="secondary-button" label="Keluar Akun" />
      </header>

      <section className="detail-card">
        <div className="detail-icon" aria-hidden="true">
          <Vault size={42} />
        </div>
        <div className="detail-main">
          <span>Nomor loker {locker.locker_number}</span>
          <h2>{locker.name}</h2>
          <StatusBadge status={locker.status} />
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-info">
          <UserCircle size={24} />
          <span>Pengguna</span>
          <strong>{profile.name ?? "User Smart Loker"}</strong>
          <p>{profile.email ?? "Email tidak tersedia"}</p>
        </article>
        <article className="detail-info">
          <CalendarClock size={24} />
          <span>Terakhir Dibuka</span>
          <strong>{formatTime(locker.last_opened_at)}</strong>
          <p>Waktu diperbarui setelah perangkat memproses perintah buka.</p>
        </article>
        <article className="detail-info">
          <KeyRound size={24} />
          <span>Kontrol Loker</span>
          <strong>Buka / Tutup</strong>
          <p>Kirim perintah ke perangkat IoT untuk mengendalikan loker Anda.</p>
        </article>
      </section>

      <section className="users-card detail-control-card">
        <h2>Kontrol {locker.name}</h2>
        <p>Gunakan tombol berikut untuk membuka atau menutup loker Anda.</p>
        <LockerCommandButtons lockerId={locker.id} userId={profile.id} />
      </section>
    </main>
  );
}
