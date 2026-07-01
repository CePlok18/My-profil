import { KeyRound } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Ringkasan sistem">
        <BrandMark />
        <div className="login-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="login-copy">
          <span className="login-eyebrow">Smart Locker System</span>
          <h1>Smart Loker Penyimpanan</h1>
        </div>
      </section>
      <section className="login-panel" aria-label="Form login">
        <div className="login-card">
          <div className="login-card-heading">
            <span className="login-card-icon" aria-hidden="true">
              <KeyRound size={22} />
            </span>
            <div>
              <span>Selamat datang</span>
              <h2>Login SmartLoker</h2>
            </div>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
