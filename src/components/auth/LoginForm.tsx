"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { getDashboardPath } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

type AccountResponse = {
  message?: string;
  profile?: Profile;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Koneksi Supabase belum tersedia. Hubungi admin sistem untuk konfigurasi aplikasi."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (loginError || !data.user) {
        setError(loginError?.message ?? "Login gagal. Periksa akun Anda.");
        return;
      }

      if (!data.session) {
        setError("Sesi login gagal dibuat. Silakan coba kembali.");
        return;
      }

      const accountResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });
      const account = (await accountResponse.json()) as AccountResponse;
      const profile = account.profile;

      if (!accountResponse.ok || !profile) {
        await supabase.auth.signOut();
        setError(account.message ?? "Profil akun belum tersedia. Hubungi admin.");
        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        setError("Akun Anda belum aktif. Hubungi admin.");
        return;
      }

      window.location.href = getDashboardPath(profile.role);
    } catch {
      setError(
        "Tidak dapat terhubung ke Supabase. Periksa URL project Supabase dan koneksi internet."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {error ? <div className="auth-alert">{error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="admin@smartloker.id"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Masukkan password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </div>
      <button className="primary-button" type="submit" disabled={loading}>
        <LogIn size={18} />
        {loading ? "Memeriksa akun..." : "Masuk"}
      </button>
    </form>
  );
}
