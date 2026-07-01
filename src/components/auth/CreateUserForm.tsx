"use client";

import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import type { Locker } from "@/types/database";

type CreateUserFormProps = {
  lockers: Pick<Locker, "id" | "name" | "locker_number" | "status">[];
};

const statusLabels = {
  available: "Tersedia",
  occupied: "Digunakan"
};

export function CreateUserForm({ lockers }: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rfidUid, setRfidUid] = useState("");
  const [lockerId, setLockerId] = useState(lockers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim() || !email.trim() || !password.trim() || !lockerId) {
      setError("Nama, email, password, dan pilihan loker wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          rfidUid,
          lockerId
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Gagal membuat akun user.");
        return;
      }

      setMessage(result.message ?? "User berhasil dibuat.");
      setName("");
      setEmail("");
      setPassword("");
      setRfidUid("");
      setLockerId(lockers[0]?.id ?? "");
    } catch {
      setError(
        "Tidak dapat menghubungi server aplikasi. Periksa koneksi dan pastikan server masih berjalan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack user-form" onSubmit={handleSubmit}>
      {error ? <div className="auth-alert">{error}</div> : null}
      {message ? <div className="success-alert">{message}</div> : null}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Nama User</label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Budi Santoso"
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email Login</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@email.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password Awal</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label htmlFor="rfidUid">ID Kartu RFID untuk Kontrol Loker</label>
          <input
            id="rfidUid"
            name="rfidUid"
            value={rfidUid}
            onChange={(event) => setRfidUid(event.target.value)}
            placeholder="Contoh: 04A1B2C3"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="locker">Akses Loker</label>
          <select
            id="locker"
            name="locker"
            value={lockerId}
            onChange={(event) => setLockerId(event.target.value)}
          >
            {lockers.map((locker) => (
              <option value={locker.id} key={locker.id}>
                {locker.name} - {statusLabels[locker.status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="primary-button" type="submit" disabled={loading}>
        <UserPlus size={18} />
        {loading ? "Membuat akun..." : "Buat Akun User"}
      </button>

      <p className="form-hint">
        Satu kartu RFID hanya dapat dipasangkan ke satu user dan satu loker.
        Saat kartu ditempelkan ke reader, loker yang dipasangkan akan menerima
        perintah buka atau tutup.
      </p>
    </form>
  );
}
