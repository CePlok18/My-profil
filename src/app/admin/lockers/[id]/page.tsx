import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, KeyRound, UserCircle, Vault } from "lucide-react";
import { LockerCommandButtons } from "@/components/dashboard/LockerCommandButtons";
import { RfidCardEnrollment } from "@/components/dashboard/RfidCardEnrollment";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mockLockers } from "@/lib/mock-data";
import type { Locker } from "@/types/database";

export const dynamic = "force-dynamic";

type LockerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LockerDetail = Locker & {
  currentUserName?: string;
  currentUserEmail?: string;
  rfidCard?: {
    id: string;
    rfidUid: string;
    createdAt: string;
  } | null;
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

async function getLocker(id: string): Promise<LockerDetail | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return mockLockers.find((locker) => locker.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("lockers")
    .select(
      `
      id,
      locker_number,
      name,
      status,
      current_user_id,
      last_opened_at,
      created_at,
      updated_at,
      profiles:current_user_id (
        name,
        email
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const { data: rfidCard } = await supabase
    .from("locker_rfid_cards")
    .select("id,rfid_uid,created_at")
    .eq("locker_id", id)
    .maybeSingle();

  return {
    id: data.id,
    locker_number: data.locker_number,
    name: data.name,
    status: data.status,
    current_user_id: data.current_user_id,
    last_opened_at: data.last_opened_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    currentUserName: profile?.name ?? undefined,
    currentUserEmail: profile?.email ?? undefined,
    rfidCard: rfidCard
      ? {
          id: rfidCard.id,
          rfidUid: rfidCard.rfid_uid,
          createdAt: rfidCard.created_at
        }
      : null
  };
}

export default async function LockerDetailPage({ params }: LockerDetailPageProps) {
  const { id } = await params;
  const locker = await getLocker(id);

  if (!locker) {
    notFound();
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <section className="main-area detail-page">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/admin/dashboard">
              <ArrowLeft size={17} />
              Kembali
            </Link>
            <h1>{locker.name}</h1>
            <p>Detail status dan kontrol untuk {locker.name}.</p>
          </div>
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
            <strong>{locker.currentUserName ?? "Belum dipakai"}</strong>
            <p>{locker.currentUserEmail ?? "Belum ada user yang terdaftar pada loker ini."}</p>
          </article>
          <article className="detail-info">
            <CalendarClock size={24} />
            <span>Terakhir Dibuka</span>
            <strong>{formatTime(locker.last_opened_at)}</strong>
            <p>Waktu diperbarui saat perangkat IoT berhasil memproses perintah buka.</p>
          </article>
          <article className="detail-info">
            <KeyRound size={24} />
            <span>Kontrol Loker</span>
            <strong>Buka / Tutup</strong>
            <p>Kirim perintah ke ESP32 melalui MQTT untuk menggerakkan servo loker.</p>
          </article>
        </section>

        <section className="users-card detail-control-card">
          <h2>Kontrol {locker.name}</h2>
          <p>
            Tombol ini digunakan untuk mengirim perintah buka atau tutup ke
            perangkat IoT yang terhubung dengan {locker.name}.
          </p>
          <LockerCommandButtons lockerId={locker.id} userId={locker.current_user_id} />
        </section>

        <section className="users-card detail-control-card">
          <h2>Kartu RFID {locker.name}</h2>
          <p>
            Tambahkan, ganti, atau hapus kartu RFID yang dipasangkan langsung
            ke {locker.name}. Saat tombol tambah ditekan, tempelkan kartu ke reader.
          </p>
          <RfidCardEnrollment
            lockerId={locker.id}
            lockerName={locker.name}
            initialCard={locker.rfidCard ?? null}
          />
        </section>
      </section>
    </main>
  );
}
