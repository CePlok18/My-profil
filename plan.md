# Plan Pengembangan Web Smart Loker Penyimpanan

## 1. Gambaran Proyek

Nama aplikasi: **Smart Loker Penyimpanan**

Aplikasi web ini dibuat dengan **Next.js** dan terhubung ke **Supabase** sebagai database serta autentikasi. Web ini nantinya digunakan untuk mengelola akses loker penyimpanan berbasis IoT.

Role pengguna:

- **Admin**
  - Login ke dashboard admin.
  - Mendaftarkan akun user.
  - Melihat status 4 loker.
  - Mengelola akses user terhadap loker.

- **User**
  - Login ke dashboard user.
  - Melihat 1 loker yang diberikan akses.
  - Melihat status loker.
  - Mengirim perintah buka/tutup loker jika sudah diizinkan.

## 2. Teknologi yang Digunakan

- **Frontend**: Next.js
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Backend/API**: Next.js API Routes atau Server Actions
- **IoT Integration**: Supabase Realtime atau endpoint API untuk komunikasi dengan perangkat IoT

## 3. Struktur Halaman Awal

### 3.1 Halaman Login

URL: `/login`

Fitur:

- Form input email.
- Form input password.
- Tombol login.
- Validasi jika email/password kosong.
- Validasi jika akun tidak ditemukan atau password salah.
- Redirect berdasarkan role:
  - Admin diarahkan ke `/admin/dashboard`.
  - User diarahkan ke `/user/dashboard`.

Tampilan:

- Judul besar: **Smart Loker Penyimpanan**
- Subjudul: sistem akses loker berbasis IoT.
- Card login di tengah layar.
- Background bersih dan modern.
- Tombol login dengan loading state.

## 4. Dashboard Admin

URL: `/admin/dashboard`

Konten utama:

- Header dengan nama web: **Smart Loker Penyimpanan**
- Nama admin yang sedang login.
- Tombol logout.
- Ringkasan sistem:
  - Total loker: 4
  - Loker tersedia
  - Loker terpakai
  - User terdaftar

### 4.1 Tampilan 4 Loker

Dashboard admin menampilkan 4 buah loker:

- Loker 1
- Loker 2
- Loker 3
- Loker 4

Setiap kartu loker berisi:

- Nama loker.
- Status loker: tersedia atau digunakan.
- Nama user yang sedang memakai loker jika ada.
- Waktu terakhir dibuka.
- Tombol detail.
- Indikator warna status:
  - Hijau: tersedia/aman.
  - Kuning: sedang digunakan.

Improvisasi tambahan:

- Badge status realtime.
- Statistik penggunaan loker hari ini.
- Notifikasi aktivitas terbaru.
- Tombol refresh status.
- Filter status loker.

## 5. Manajemen User oleh Admin

URL: `/admin/users`

Fitur:

- Admin dapat membuat akun user baru.
- Admin dapat melihat daftar user.
- Admin dapat mengubah status user aktif/nonaktif.
- Admin dapat memberi akses user ke satu loker tertentu.
- Setiap user hanya diperbolehkan memiliki akses ke 1 loker.
- Admin dapat menghapus atau menonaktifkan user.

Form tambah user:

- Nama lengkap.
- Email.
- Password awal.
- Nomor RFID/PIN jika dibutuhkan oleh IoT.
- Pilihan 1 loker yang boleh diakses.

## 6. Dashboard User

URL: `/user/dashboard`

Fitur:

- Menampilkan nama web.
- Menampilkan profil singkat user.
- Menampilkan 1 loker yang dapat diakses user.
- Menampilkan status loker.
- Tombol permintaan buka loker.
- Riwayat penggunaan loker milik user.

## 7. Rancangan Database Supabase

### 7.1 Tabel `profiles`

Menyimpan data tambahan dari akun Supabase Auth.

Kolom:

- `id` UUID primary key, relasi ke `auth.users.id`
- `name` text
- `email` text
- `role` text, nilai: `admin` atau `user`
- `is_active` boolean
- `created_at` timestamp

### 7.2 Tabel `lockers`

Menyimpan data loker.

Kolom:

- `id` UUID primary key
- `locker_number` integer
- `name` text
- `status` text, nilai: `available` atau `occupied`
- `current_user_id` UUID nullable, relasi ke `profiles.id`
- `last_opened_at` timestamp nullable
- `created_at` timestamp
- `updated_at` timestamp

Data awal:

- Loker 1
- Loker 2
- Loker 3
- Loker 4

### 7.3 Tabel `locker_access`

Menyimpan hak akses user terhadap loker.

Aturan penting:

- Satu user hanya boleh memiliki akses ke satu loker.
- Constraint database perlu memakai `unique (user_id)` agar user tidak bisa diberi lebih dari satu loker.

Kolom:

- `id` UUID primary key
- `user_id` UUID, relasi ke `profiles.id`
- `locker_id` UUID, relasi ke `lockers.id`
- `created_at` timestamp

### 7.4 Tabel `locker_logs`

Menyimpan riwayat aktivitas loker.

Kolom:

- `id` UUID primary key
- `locker_id` UUID, relasi ke `lockers.id`
- `user_id` UUID nullable, relasi ke `profiles.id`
- `action` text, contoh: `open`, `close`, `lock`, `unlock`, `error`
- `source` text, contoh: `web`, `iot`
- `description` text nullable
- `created_at` timestamp

## 8. Rencana Integrasi IoT

Tahap awal:

- Web hanya menampilkan status loker dari Supabase.
- Perangkat IoT membaca status/perintah dari Supabase atau endpoint API.

Alur buka loker:

1. User menekan tombol buka loker di web.
2. Web membuat command baru untuk perangkat IoT.
3. Perangkat IoT membaca command tersebut.
4. Perangkat IoT membuka solenoid/relay loker.
5. Perangkat IoT mengirim status terbaru ke Supabase.
6. Dashboard web memperbarui status secara realtime.

Tambahan tabel opsional: `locker_commands`

Kolom:

- `id` UUID primary key
- `locker_id` UUID
- `user_id` UUID nullable
- `command` text, contoh: `open`, `close`, `lock`
- `status` text, contoh: `pending`, `processed`, `failed`
- `created_at` timestamp
- `processed_at` timestamp nullable

## 9. Struktur Folder Next.js yang Disarankan

```text
src/
  app/
    login/
      page.tsx
    admin/
      dashboard/
        page.tsx
      users/
        page.tsx
    user/
      dashboard/
        page.tsx
  components/
    auth/
      LoginForm.tsx
    dashboard/
      LockerCard.tsx
      StatusBadge.tsx
      SummaryCard.tsx
    layout/
      AppHeader.tsx
      Sidebar.tsx
  lib/
    supabase/
      client.ts
      server.ts
    auth.ts
  types/
    database.ts
```

## 10. Tahapan Pengerjaan

### Tahap 1: Setup Project

- Buat project Next.js.
- Install Tailwind CSS.
- Install Supabase client.
- Buat file environment `.env.local`.
- Hubungkan project ke Supabase.

### Tahap 2: Setup Supabase

- Buat tabel `profiles`.
- Buat tabel `lockers`.
- Buat tabel `locker_access`.
- Buat tabel `locker_logs`.
- Tambahkan data awal 4 loker.
- Aktifkan Row Level Security.
- Buat policy untuk admin dan user.

### Tahap 3: Halaman Login

- Buat tampilan login.
- Hubungkan form login ke Supabase Auth.
- Ambil role user dari tabel `profiles`.
- Redirect user sesuai role.
- Tambahkan validasi error dan loading.

### Tahap 4: Dashboard Admin

- Buat layout admin.
- Tampilkan nama web.
- Tampilkan 4 kartu loker.
- Tampilkan ringkasan status.
- Tampilkan aktivitas terbaru.
- Tambahkan tombol logout.

### Tahap 5: Manajemen User

- Buat halaman daftar user.
- Buat form tambah user.
- Hubungkan pembuatan akun user ke Supabase.
- Tambahkan fitur pemberian akses loker.

### Tahap 6: Dashboard User

- Buat halaman dashboard user.
- Tampilkan satu loker yang bisa diakses user.
- Tambahkan tombol request buka loker.
- Tampilkan riwayat penggunaan.

### Tahap 7: Integrasi IoT

- Buat mekanisme command loker.
- Buat endpoint API untuk perangkat IoT.
- Tambahkan endpoint scan RFID untuk membuka loker berdasarkan UID kartu.
- Tambahkan UI enrollment RFID pada detail loker: tambah kartu, ganti kartu, hapus kartu.
- Tambahkan update status dari perangkat IoT.
- Aktifkan Supabase Realtime untuk status loker.

### Tahap 8: Testing dan Penyempurnaan

- Test login admin.
- Test login user.
- Test admin membuat user.
- Test tampilan 4 loker.
- Test update status loker.
- Test hak akses user.
- Test responsif di mobile dan desktop.

## 11. Prioritas Implementasi Pertama

Prioritas pertama yang akan dibuat:

1. Setup project Next.js.
2. Setup Supabase client.
3. Buat halaman login.
4. Buat role admin dan user.
5. Buat dashboard admin.
6. Tampilkan 4 loker: Loker 1 sampai Loker 4.

## 12. Ide Tampilan Dashboard Admin

Elemen tampilan:

- Sidebar kiri:
  - Dashboard
  - Data User
  - Data Loker
  - Riwayat
  - Pengaturan

- Header atas:
  - Smart Loker Penyimpanan
  - Nama admin
  - Tombol logout

- Area konten:
  - Empat summary card.
  - Grid 4 kartu loker.
  - Panel aktivitas terbaru.

Gaya desain:

- Bersih, modern, dan mudah dipahami.
- Warna utama biru atau hijau teknologi.
- Status loker memakai warna berbeda agar cepat terbaca.
- Layout responsif untuk laptop dan handphone.

## 13. Catatan Keamanan

- Password user tidak boleh disimpan manual di tabel biasa.
- Gunakan Supabase Auth untuk autentikasi.
- Gunakan Row Level Security agar user hanya bisa melihat data miliknya.
- Admin harus punya akses khusus untuk membuat dan mengelola user.
- Endpoint IoT perlu token atau API key khusus agar tidak bisa diakses sembarang orang.
