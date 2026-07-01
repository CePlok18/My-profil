"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  IdCard,
  KeyRound,
  LockKeyhole,
  Mail,
  UserCircle
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LockerCard } from "@/components/dashboard/LockerCard";
import { BrandMark } from "@/components/layout/BrandMark";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locker, Profile } from "@/types/database";

type DashboardState = {
  loading: boolean;
  error: string;
  profile: Profile | null;
  locker: Locker | null;
};

type AccountResponse = {
  message?: string;
  profile?: Profile;
  locker?: Locker | null;
};

export function UserDashboardClient() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: "",
    profile: null,
    locker: null
  });

  useEffect(() => {
    async function loadDashboard() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setState({
          loading: false,
          error: "Koneksi Supabase belum tersedia.",
          profile: null,
          locker: null
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

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
        setState({
          loading: false,
          error: account.message ?? "Profil akun tidak ditemukan.",
          profile: null,
          locker: null
        });
        return;
      }

      setState({
        loading: false,
        error: "",
        profile: account.profile,
        locker: account.locker ?? null
      });
    }

    loadDashboard();
  }, []);

  const profileName = state.profile?.name ?? "User Smart Loker";
  const profileEmail = state.profile?.email ?? "-";
  const lockerCount = state.locker ? 1 : 0;

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <BrandMark />
          <h1 style={{ marginTop: 22 }}>Dashboard User</h1>
        </div>
        <div className="topbar-actions">
          <LogoutButton className="secondary-button" label="Keluar Akun" />
        </div>
      </header>

      {state.error ? <div className="auth-alert">{state.error}</div> : null}

      <section className="profile-card" aria-label="Profil akun">
        <div className="profile-avatar" aria-hidden="true">
          <UserCircle size={48} />
        </div>
        <div className="profile-main">
          <span>Profil Akun</span>
          <h2>{state.loading ? "Memuat profil..." : profileName}</h2>
        </div>
        <div className="profile-details">
          <div>
            <Mail size={17} />
            <span>{profileEmail}</span>
          </div>
          <div>
            <BadgeCheck size={17} />
            <span>{state.profile?.is_active ? "Status aktif" : "Status nonaktif"}</span>
          </div>
          <div>
            <KeyRound size={17} />
            <span>{state.locker?.name ?? "Belum ada loker"}</span>
          </div>
          <div>
            <IdCard size={17} />
            <span>{state.profile?.rfid_uid ?? "RFID belum terdaftar"}</span>
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="Ringkasan user">
        <article className="summary-card">
          <span>Akses Loker</span>
          <strong>{state.loading ? "..." : lockerCount}</strong>
          <KeyRound size={20} color="var(--brand)" />
        </article>
        <article className="summary-card">
          <span>Status Akun</span>
          <strong>{state.profile?.is_active ? "Aktif" : "Nonaktif"}</strong>
          <LockKeyhole size={20} color="var(--brand)" />
        </article>
      </section>

      <section className="locker-grid" style={{ marginTop: 18 }}>
        {state.locker ? (
          <LockerCard
            locker={state.locker}
            userId={state.profile?.id}
            detailHref={`/user/lockers/${state.locker.id}`}
          />
        ) : (
          <div className="empty-state">
            {state.loading
              ? "Memuat data loker..."
              : "Akun ini belum diberikan akses loker oleh admin."}
          </div>
        )}
      </section>
    </main>
  );
}
