"use client";

import { useState } from "react";
import { LockKeyhole, Unlock } from "lucide-react";

type LockerCommandButtonsProps = {
  lockerId: string;
  userId?: string | null;
};

export function LockerCommandButtons({
  lockerId,
  userId = null
}: LockerCommandButtonsProps) {
  const [loadingCommand, setLoadingCommand] = useState<"open" | "close" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendCommand(command: "open" | "close") {
    setLoadingCommand(command);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/locker-commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lockerId,
          command,
          userId
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Gagal mengirim perintah.");
        return;
      }

      setMessage(result.message ?? "Perintah berhasil dikirim.");
    } catch {
      setError(
        "Tidak dapat menghubungi server aplikasi. Periksa koneksi dan pastikan server masih berjalan."
      );
    } finally {
      setLoadingCommand("");
    }
  }

  return (
    <div className="command-panel">
      <div className="command-buttons">
        <button
          className="primary-button"
          type="button"
          onClick={() => sendCommand("open")}
          disabled={Boolean(loadingCommand)}
        >
          <Unlock size={17} />
          {loadingCommand === "open" ? "Mengirim..." : "Buka"}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => sendCommand("close")}
          disabled={Boolean(loadingCommand)}
        >
          <LockKeyhole size={17} />
          {loadingCommand === "close" ? "Mengirim..." : "Tutup"}
        </button>
      </div>
      {message ? <span className="command-message">{message}</span> : null}
      {error ? <span className="command-error">{error}</span> : null}
    </div>
  );
}
