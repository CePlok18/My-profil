"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, RefreshCw, Trash2 } from "lucide-react";

type RfidCard = {
  id: string;
  rfidUid: string;
  createdAt: string;
};

type Enrollment = {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  rfidUid: string | null;
  errorMessage: string | null;
};

type RfidCardResponse = {
  card: RfidCard | null;
  enrollment: Enrollment | null;
  message?: string;
};

type RfidCardEnrollmentProps = {
  lockerId: string;
  lockerName: string;
  initialCard: RfidCard | null;
};

export function RfidCardEnrollment({
  lockerId,
  lockerName,
  initialCard
}: RfidCardEnrollmentProps) {
  const [card, setCard] = useState<RfidCard | null>(initialCard);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const endpoint = `/api/admin/lockers/${encodeURIComponent(lockerId)}/rfid-card`;

  const loadStatus = useCallback(async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const result = (await response.json()) as RfidCardResponse;

    if (!response.ok) {
      setError(result.message ?? "Gagal membaca status kartu RFID.");
      return;
    }

    setCard(result.card);
    setEnrollment(result.enrollment);

    if (result.enrollment?.status === "completed") {
      setMessage("Kartu RFID berhasil terdaftar.");
    }

    if (result.enrollment?.status === "failed") {
      setError(result.enrollment.errorMessage ?? "Pendaftaran kartu gagal.");
    }
  }, [endpoint]);

  async function startEnrollment() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST"
      });
      const result = (await response.json()) as RfidCardResponse;

      if (!response.ok) {
        setError(result.message ?? "Gagal memulai pendaftaran kartu.");
        return;
      }

      setEnrollment(result.enrollment);
      setMessage(`Tempelkan kartu RFID untuk ${lockerName}.`);
    } catch {
      setError("Tidak dapat menghubungi server aplikasi.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCard() {
    const confirmed = window.confirm(`Hapus kartu RFID dari ${lockerName}?`);

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "DELETE"
      });
      const result = (await response.json()) as RfidCardResponse;

      if (!response.ok) {
        setError(result.message ?? "Gagal menghapus kartu RFID.");
        return;
      }

      setCard(null);
      setEnrollment(null);
      setMessage(result.message ?? "Kartu RFID berhasil dihapus.");
    } catch {
      setError("Tidak dapat menghubungi server aplikasi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (enrollment?.status !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadStatus();
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [enrollment?.status, loadStatus]);

  return (
    <div className="rfid-panel">
      <div className="rfid-card-preview">
        <div className="rfid-icon" aria-hidden="true">
          {enrollment?.status === "pending" ? (
            <RefreshCw className="spin-icon" size={24} />
          ) : (
            <CreditCard size={24} />
          )}
        </div>
        <div>
          <span>ID Kartu RFID</span>
          <strong>{card?.rfidUid ?? "Belum ada kartu"}</strong>
          <p>
            {enrollment?.status === "pending"
              ? "Menunggu kartu ditempelkan ke reader RFID."
              : card
                ? "Kartu ini dapat membuka dan menutup loker yang dipasangkan."
                : "Tambahkan kartu dengan menekan tombol lalu scan kartu RFID."}
          </p>
        </div>
      </div>

      <div className="rfid-actions">
        <button
          className="primary-button"
          type="button"
          onClick={startEnrollment}
          disabled={loading || enrollment?.status === "pending"}
        >
          <CreditCard size={17} />
          {card ? "Ganti Kartu" : "Tambahkan Kartu"}
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={deleteCard}
          disabled={loading || !card}
        >
          <Trash2 size={16} />
          Hapus Kartu
        </button>
      </div>

      {message ? <span className="command-message">{message}</span> : null}
      {error ? <span className="command-error">{error}</span> : null}
    </div>
  );
}
