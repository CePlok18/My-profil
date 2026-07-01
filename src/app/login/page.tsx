import { LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Ringkasan sistem">
        <BrandMark />
        <div className="login-copy">
          <h1>Smart Loker Penyimpanan</h1>
          <p>
            Kelola akses admin, user, dan status loker IoT dari satu dashboard
            yang siap tersambung ke Supabase.
          </p>
        </div>
        <div className="login-stats">
          <div className="login-stat">
            <LockKeyhole size={20} />
            <strong>4</strong>
            <span>Loker aktif</span>
          </div>
        </div>
      </section>
      <section className="login-panel" aria-label="Form login">
        <div className="login-card">
          <h2>Masuk ke Sistem</h2>
          <p>Gunakan akun admin atau user yang sudah terdaftar.</p>
          <LoginForm />
          <div className="info-note">
            Admin dibuat melalui Supabase. Setelah login, sistem membaca role
            dari tabel <strong>profiles</strong>.
          </div>
        </div>
      </section>
    </main>
  );
}
