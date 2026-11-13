-- ============================================================
-- TBCW 4B — CONTENT TABLES (вставить в SQL Editor → Run)
-- Требует: sql/schema.sql уже прогнан (profiles, is_admin)
-- ============================================================

-- Роль текущего пользователя (для RLS)
create or replace function public.member_role()
returns text language sql stable security definer
set search_path = public
as $$
    select coalesce(
        (select role from public.profiles where id = auth.uid()),
        'guest'
    );
$$;

-- ============================================================
-- DOSSIERS: личные досье (base+) и лорные персонажи (extended+)
-- ============================================================
create table if not exists public.dossiers (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    data jsonb not null,
    kind text not null default 'personal' check (kind in ('personal', 'lore')),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- один архив/досье = один TBCW-ID
create unique index if not exists dossiers_data_id_uidx
    on public.dossiers ((data->>'id'));

alter table public.dossiers enable row level security;

-- чтение: approved для членов (не гостевая роль), своё — всегда, админу — всё
drop policy if exists "dossiers: read" on public.dossiers;
create policy "dossiers: read"
    on public.dossiers for select
    to authenticated
    using (
        public.member_role() <> 'guest'
        and (
            status = 'approved'
            or owner_id = auth.uid()
            or public.member_role() = 'admin'
        )
    );

-- вставка личного досье на себя: base/extended/admin
drop policy if exists "dossiers: insert personal" on public.dossiers;
create policy "dossiers: insert personal"
    on public.dossiers for insert
    to authenticated
    with check (
        owner_id = auth.uid()
        and kind = 'personal'
        and public.member_role() in ('base', 'extended', 'admin')
    );

-- вставка лорного персонажа: extended/admin
drop policy if exists "dossiers: insert lore" on public.dossiers;
create policy "dossiers: insert lore"
    on public.dossiers for insert
    to authenticated
    with check (
        owner_id = auth.uid()
        and kind = 'lore'
        and public.member_role() in ('extended', 'admin')
    );

-- правка своего pending-досье
drop policy if exists "dossiers: owner updates pending" on public.dossiers;
create policy "dossiers: owner updates pending"
    on public.dossiers for update
    to authenticated
    using (owner_id = auth.uid() and status = 'pending')
    with check (owner_id = auth.uid() and status = 'pending');

-- админ правит всё
drop policy if exists "dossiers: admin updates" on public.dossiers;
create policy "dossiers: admin updates"
    on public.dossiers for update
    to authenticated
    using (public.is_admin());

-- удаление: своё pending, админу — всё
drop policy if exists "dossiers: owner deletes pending" on public.dossiers;
create policy "dossiers: owner deletes pending"
    on public.dossiers for delete
    to authenticated
    using (owner_id = auth.uid() and status = 'pending');

drop policy if exists "dossiers: admin deletes" on public.dossiers;
create policy "dossiers: admin deletes"
    on public.dossiers for delete
    to authenticated
    using (public.is_admin());

-- ============================================================
-- LORE DOCS: архивные документы (extended/admin)
-- ============================================================
create table if not exists public.lore_docs (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references auth.users(id) on delete cascade,
    doc_id text not null unique,
    title text not null,
    category text not null default 'lore' check (category in ('branch', 'lore')),
    content text not null,
    is_public_brief boolean not null default false,
    status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.lore_docs enable row level security;

-- чтение: brief виден всем (в т.ч. гостевой роли); approved — членам;
-- pending — только автору и админу
drop policy if exists "lore_docs: read" on public.lore_docs;
create policy "lore_docs: read"
    on public.lore_docs for select
    to authenticated
    using (
        is_public_brief
        or public.member_role() = 'admin'
        or author_id = auth.uid()
        or (
            public.member_role() <> 'guest'
            and status = 'approved'
        )
    );

-- вставка/правка/удаление: extended/admin
drop policy if exists "lore_docs: write" on public.lore_docs;
create policy "lore_docs: write"
    on public.lore_docs for insert
    to authenticated
    with check (author_id = auth.uid() and public.member_role() in ('extended', 'admin'));

drop policy if exists "lore_docs: author updates" on public.lore_docs;
create policy "lore_docs: author updates"
    on public.lore_docs for update
    to authenticated
    using (author_id = auth.uid() or public.is_admin());

drop policy if exists "lore_docs: author deletes" on public.lore_docs;
create policy "lore_docs: author deletes"
    on public.lore_docs for delete
    to authenticated
    using (author_id = auth.uid() or public.is_admin());

-- ============================================================
-- STORAGE: бакет media (портреты, аудио, картинки документов)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read"
    on storage.objects for select
    using (bucket_id = 'media');

drop policy if exists "media: member insert" on storage.objects;
create policy "media: member insert"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'media' and public.member_role() <> 'guest');

drop policy if exists "media: member update" on storage.objects;
create policy "media: member update"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'media' and public.member_role() <> 'guest');

drop policy if exists "media: member delete" on storage.objects;
create policy "media: member delete"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'media' and public.member_role() <> 'guest');
