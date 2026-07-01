-- Jalankan file ini jika tabel lockers sudah pernah dibuat dengan status lama.
-- Aturan baru: status loker hanya available atau occupied.

update public.lockers
set status = 'occupied'
where status in ('locked', 'open', 'error');

alter table public.lockers
drop constraint if exists lockers_status_check;

alter table public.lockers
add constraint lockers_status_check
check (status in ('available', 'occupied'));