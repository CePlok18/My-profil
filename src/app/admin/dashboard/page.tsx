import { Activity, LockKeyhole, Unlock, Vault } from "lucide-react";
import { LockerCard } from "@/components/dashboard/LockerCard";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { mockLockers } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locker, LockerLog } from "@/types/database";

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

function getJakartaTodayStart() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const date = `${value("year")}-${value("month")}-${value("day")}`;

  return new Date(`${date}T00:00:00+07:00`).toISOString();
}

async function getActivityData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { logs: [] as LockerLog[], todayCount: 0 };
  }

  const [recentResult, countResult] = await Promise.all([
    supabase
      .from("locker_logs")
      .select("id,locker_id,user_id,action,source,description,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("locker_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", getJakartaTodayStart())
  ]);

  return {
    logs: recentResult.error ? [] : ((recentResult.data ?? []) as LockerLog[]),
    todayCount: countResult.error ? 0 : (countResult.count ?? 0)
  };
}

function formatRelativeTime(createdAt: string) {
  const differenceMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const minutes = Math.floor(differenceMs / 60000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(createdAt));
}

export default async function AdminDashboardPage() {
  const [lockers, activityData] = await Promise.all([
    getLockers(),
    getActivityData()
  ]);
  const available = lockers.filter((locker) => locker.status === "available").length;
  const used = lockers.filter((locker) => locker.current_user_id).length;
  const lockerById = new Map(lockers.map((locker) => [locker.id, locker]));

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
          <SummaryCard
            label="Aktivitas Hari Ini"
            value={activityData.todayCount}
            icon={Activity}
          />
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
              {activityData.logs.length ? (
                activityData.logs.map((log) => {
                  const locker = lockerById.get(log.locker_id);
                  const lockerLabel = locker?.name ?? "Loker";
                  const actionLabel =
                    log.action === "open"
                      ? "dibuka"
                      : log.action === "close"
                        ? "ditutup"
                        : log.action;

                  return (
                    <li key={log.id}>
                      <span className="activity-dot" />
                      <div>
                        <strong>
                          {lockerLabel} {actionLabel}
                        </strong>
                        <span>
                          {log.description ?? `Aktivitas dari ${log.source}`},{" "}
                          {formatRelativeTime(log.created_at)}.
                        </span>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li>
                  <span className="activity-dot" />
                  <div>
                    <strong>Belum ada aktivitas</strong>
                    <span>Log terbaru akan tampil setelah loker digunakan.</span>
                  </div>
                </li>
              )}
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
