create table if not exists public.locker_commands (
  id uuid primary key default gen_random_uuid(),
  locker_id uuid not null references public.lockers(id) on delete cascade,
  command text not null check (command in ('open', 'close')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed')),
  source text not null default 'web',
  requested_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists locker_commands_pending_idx
on public.locker_commands (status, created_at);
