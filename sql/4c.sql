-- ============================================================
-- TBCW 4C — CLOCK EVENTS (вставить в SQL Editor → Run)
-- Требует: sql/schema.sql + sql/4b.sql (profiles, member_role)
-- ============================================================

create table if not exists public.clock_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    kind text not null check (kind in ('in', 'out')),
    created_at timestamptz not null default now()
);

create index if not exists clock_events_user_idx
    on public.clock_events (user_id, created_at);

alter table public.clock_events enable row level security;

-- вставка: только своё событие, роль не guest
drop policy if exists "clock: insert own" on public.clock_events;
create policy "clock: insert own"
    on public.clock_events for insert
    to authenticated
    with check (user_id = auth.uid() and public.member_role() <> 'guest');

-- чтение: свои события, админу — все
drop policy if exists "clock: read own" on public.clock_events;
create policy "clock: read own"
    on public.clock_events for select
    to authenticated
    using (user_id = auth.uid() or public.is_admin());

-- лог неизменяемый: update запрещён всем; delete — только админу
drop policy if exists "clock: admin deletes" on public.clock_events;
create policy "clock: admin deletes"
    on public.clock_events for delete
    to authenticated
    using (public.is_admin());
