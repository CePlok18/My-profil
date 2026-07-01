alter table public.profiles
add column if not exists rfid_uid text;

create unique index if not exists profiles_rfid_uid_unique_idx
on public.profiles (rfid_uid)
where rfid_uid is not null;

create index if not exists profiles_rfid_uid_lookup_idx
on public.profiles (rfid_uid);

create unique index if not exists locker_access_one_user_per_locker_idx
on public.locker_access (locker_id);
