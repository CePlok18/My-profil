import { Activity, LockKeyhole, Unlock, Vault } from "lucide-react";
import { LockerCard } from "@/components/dashboard/LockerCard";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { mockLockers } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locker } from "@/types/database";

export const dynamic = "force-dynamic";

async function getLockers(): Promise<Locker[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return mockLockers;
  }

  const { data, error } = await supabase
    .from("lockers")
    .select(
      "id,locker_number,name,status,current_user_id,last_opened_at,created_at,updated_at"
    )
    .order("locker_number", { ascending: true });

  if (error || !data?.length) {
    return mockLockers;
  }

  return data as Locker[];
}

export default async function AdminDashboardPage() {
  const lockers = await getLockers();
  const available = lockers.filter((locker) => locker.status === "available").length;
  const used = lockers.filter((locker) => locker.current_user_id).length;

  return (
    <main className="app-shell">
      <Sidebar />
      <section className="main-area">
        <header className="topbar">
          <div>
            <h1>Smart Loker Penyimpanan</h1>
            <p>Dashboard admin untuk memantau loker dan akses pengguna.</p>
          </div>
          <div className="topbar-actions">
            <RefreshButton />
          </div>
        </header>

        <section className="summary-grid" aria-label="Ringkasan loker">
          <SummaryCard label="Total Loker" value={lockers.length} icon={Vault} />
          <SummaryCard label="Tersedia" value={available} icon={Unlock} />
          <SummaryCard label="Terpakai" value={used} icon={LockKeyhole} />
          <SummaryCard label="Aktivitas Hari Ini" value={12} icon={Activity} />
        </section>

        <section className="dashboard-grid">
          <div className="locker-grid" aria-label="Daftar loker">
            {lockers.map((locker) => (
              <LockerCard locker={locker} key={locker.id} />
            ))}
          </div>

          <aside className="activity-panel" aria-label="Aktivitas terbaru">
            <div className="panel-title">
              <h2>Aktivitas Terbaru</h2>
              <Activity size={18} color="var(--brand)" />
            </div>
            <ul className="activity-list">
              <li>
                <span className="activity-dot" />
                <div>
                  <strong>Loker 4 terbuka</strong>
                  <span>Perintah dari dashboard user, 4 menit lalu.</span>
                </div>
              </li>
              <li>
                <span className="activity-dot" />
                <div>
                  <strong>Loker 2 digunakan</strong>
                  <span>Akses diberikan oleh admin, 47 menit lalu.</span>
                </div>
              </li>
              <li>
                <span className="activity-dot" />
                <div>
                  <strong>Sinkronisasi IoT</strong>
                  <span>Perangkat berhasil mengirim status terbaru.</span>
                </div>
              </li>
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
