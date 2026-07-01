"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  rfidUid: string | null;
  lockerName: string;
};

type RegisteredUsersTableProps = {
  users: RegisteredUser[];
};

export function RegisteredUsersTable({ users }: RegisteredUsersTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function deleteUser(user: RegisteredUser) {
    const confirmed = window.confirm(
      `Hapus akun ${user.name} dari ${user.lockerName}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setDeletingId(user.id);

    const response = await fetch(
      `/api/admin/users?userId=${encodeURIComponent(user.id)}`,
      {
        method: "DELETE"
      }
    );

    const result = (await response.json()) as { message?: string };
    setDeletingId("");

    if (!response.ok) {
      setError(result.message ?? "Gagal menghapus akun user.");
      return;
    }

    setMessage(result.message ?? "Akun user berhasil dihapus.");
    router.refresh();
  }

  return (
    <div className="registered-users">
      {error ? <div className="auth-alert">{error}</div> : null}
      {message ? <div className="success-alert">{message}</div> : null}

      {users.length ? (
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>RFID</th>
                <th>Loker</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.rfidUid ?? "-"}</td>
                  <td>{user.lockerName}</td>
                  <td>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => deleteUser(user)}
                      disabled={deletingId === user.id}
                    >
                      <Trash2 size={16} />
                      {deletingId === user.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">Belum ada user yang terdaftar di loker.</p>
      )}
    </div>
  );
}
