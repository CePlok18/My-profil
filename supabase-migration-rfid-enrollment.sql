create table if not exists public.locker_rfid_cards (
  id uuid primary key default gen_random_uuid(),
  locker_id uuid not null references public.lockers(id) on delete cascade,
  rfid_uid text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists locker_rfid_cards_locker_unique_idx
on public.locker_rfid_cards (locker_id);

create unique index if not exists locker_rfid_cards_uid_unique_idx
on public.locker_rfid_cards (rfid_uid);

create index if not exists locker_rfid_cards_uid_lookup_idx
on public.locker_rfid_cards (rfid_uid);

create table if not exists public.rfid_enrollments (
  id uuid primary key default gen_random_uuid(),
  locker_id uuid not null references public.lockers(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'cancelled')),
  rfid_uid text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists rfid_enrollments_pending_idx
on public.rfid_enrollments (status, created_at);

create index if not exists rfid_enrollments_locker_created_idx
on public.rfid_enrollments (locker_id, created_at desc);
