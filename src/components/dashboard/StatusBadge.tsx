import { Circle } from "lucide-react";
import type { LockerStatus } from "@/types/database";

const statusLabels: Record<LockerStatus, string> = {
  available: "Tersedia",
  occupied: "Digunakan"
};

export function StatusBadge({ status }: { status: LockerStatus }) {
  return (
    <span className={`status-badge ${status}`}>
      <Circle size={9} fill="currentColor" />
      {statusLabels[status]}
    </span>
  );
}
