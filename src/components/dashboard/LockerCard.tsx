import Link from "next/link";
import { DoorOpen, Eye, KeyRound } from "lucide-react";
import type { Locker } from "@/types/database";
import { LockerCommandButtons } from "./LockerCommandButtons";
import { StatusBadge } from "./StatusBadge";

function formatTime(value: string | null) {
  if (!value) {
    return "Belum ada aktivitas";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export function LockerCard({
  locker,
  userId = null,
  detailHref = `/admin/lockers/${locker.id}`
}: {
  locker: Locker;
  userId?: string | null;
  detailHref?: string;
}) {
  const userLabel = locker.current_user_id ? "User terdaftar" : "Belum dipakai";

  return (
    <article className="locker-card">
      <div className="locker-head">
        <div>
          <h2>{locker.name}</h2>
          <p>Nomor loker {locker.locker_number}</p>
        </div>
        <div className="locker-icon" aria-hidden="true">
          <DoorOpen size={24} />
        </div>
      </div>

      <StatusBadge status={locker.status} />

      <div className="locker-meta">
        <p>
          <strong>Pengguna:</strong> {userLabel}
        </p>
        <p>
          <strong>Terakhir dibuka:</strong> {formatTime(locker.last_opened_at)}
        </p>
      </div>

      <div className="locker-actions">
        <Link className="secondary-button" href={detailHref}>
          <Eye size={17} />
          Detail
        </Link>
        <button className="icon-button" type="button" aria-label={`Kontrol ${locker.name}`}>
          <KeyRound size={18} />
        </button>
      </div>

      <LockerCommandButtons lockerId={locker.id} userId={userId} />
    </article>
  );
}
