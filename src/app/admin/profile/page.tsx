import {
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserCircle,
  Users,
  Vault
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminProfilePage() {
  return (
    <main className="app-shell">
      <Sidebar />
      <section className="main-area profile-page">
        <header className="topbar">
          <div>
            <h1>Profile Akun</h1>
            <p>Informasi lengkap akun admin Smart Loker Penyimpanan.</p>
          </div>
          <div className="topbar-actions">
            <LogoutButton className="secondary-button" label="Keluar Akun" />
          </div>
        </header>

        <section className="profile-hero" aria-label="Profil admin">
          <div className="profile-hero-avatar" aria-hidden="true">
            <UserCircle size={72} />
          </div>
          <div>
            <span>Administrator</span>
            <h2>Admin Smart Loker</h2>
            <p>
              Akun ini digunakan untuk mengelola user, memantau status loker,
              dan mengatur akses penyimpanan.
            </p>
          </div>
        </section>

        <section className="profile-info-grid" aria-label="Detail profil">
          <article className="profile-info-card">
            <Mail size={22} />
            <span>Email</span>
            <strong>admin@smartloker.id</strong>
          </article>
          <article className="profile-info-card">
            <ShieldCheck size={22} />
            <span>Role Akun</span>
            <strong>Admin</strong>
          </article>
          <article className="profile-info-card">
            <BadgeCheck size={22} />
            <span>Status</span>
            <strong>Aktif</strong>
          </article>
          <article className="profile-info-card">
            <CalendarDays size={22} />
            <span>Bergabung</span>
            <strong>25 Mei 2026</strong>
          </article>
        </section>

        <section className="users-card profile-access-card">
          <h2>Akses Admin</h2>
          <div className="access-list">
            <div>
              <Users size={20} />
              <span>Mendaftarkan dan menghapus akun user.</span>
            </div>
            <div>
              <Vault size={20} />
              <span>Memantau 4 loker dan status tersedia/digunakan.</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Mengelola akses satu user untuk satu loker.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
