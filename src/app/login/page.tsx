import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Ringkasan sistem">
        <BrandMark />
        <div className="login-copy">
          <h1>Smart Loker Penyimpanan</h1>
        </div>
      </section>
      <section className="login-panel" aria-label="Form login">
        <div className="login-card">
          <h2>Masuk ke Sistem</h2>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
