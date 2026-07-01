import { Sidebar } from "@/components/layout/Sidebar";
import { CreateUserForm } from "@/components/auth/CreateUserForm";
import {
  RegisteredUsersTable,
  type RegisteredUser
} from "@/components/auth/RegisteredUsersTable";
import { mockLockers } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locker } from "@/types/database";

export const dynamic = "force-dynamic";

async function getLockers() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return mockLockers;
  }

  const { data, error } = await supabase
    .from("lockers")
    .select("id,name,locker_number,status")
    .order("locker_number", { ascending: true });

  if (error || !data?.length) {
    return mockLockers;
  }

  return data as Pick<Locker, "id" | "name" | "locker_number" | "status">[];
}

async function getRegisteredUsers(): Promise<RegisteredUser[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("locker_access")
    .select(
      `
      user_id,
      profiles:user_id (
        name,
        email,
        rfid_uid
      ),
      lockers:locker_id (
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  return data.map((item) => {
    const profile = Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles;
    const locker = Array.isArray(item.lockers) ? item.lockers[0] : item.lockers;

    return {
      id: item.user_id,
      name: profile?.name ?? "Tanpa nama",
      email: profile?.email ?? "-",
      rfidUid: profile?.rfid_uid ?? null,
      lockerName: locker?.name ?? "Loker tidak ditemukan"
    };
  });
}

export default async function AdminUsersPage() {
  const lockers = await getLockers();
  const registeredUsers = await getRegisteredUsers();

  return (
    <main className="app-shell">
      <Sidebar />
      <section className="main-area users-page">
        <header className="topbar">
          <div>
            <h1>Data User</h1>
            <p>Halaman awal untuk admin mendaftarkan user Smart Loker Penyimpanan.</p>
          </div>
        </header>
        <section className="users-card">
          <h2>Tambah Akun User</h2>
          <p>
            Admin dapat membuat akun user baru untuk login ke web dan memilih
            satu loker yang boleh diakses user tersebut.
          </p>
          <CreateUserForm lockers={lockers} />
        </section>

        <section className="users-card users-list-card">
          <h2>User Terdaftar di Loker</h2>
          <p>
            Admin dapat menghapus akun user yang sudah terdaftar pada loker.
            Setelah dihapus, loker akan dikembalikan menjadi tersedia.
          </p>
          <RegisteredUsersTable users={registeredUsers} />
        </section>
      </section>
    </main>
  );
}
