-- Jalankan file ini jika tabel locker_access sudah pernah dibuat sebelumnya.
-- Aturan: setiap user hanya boleh memiliki akses ke 1 loker.

alter table public.locker_access
add constraint locker_access_one_locker_per_user unique (user_id);
