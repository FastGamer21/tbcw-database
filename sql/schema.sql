-- ============================================================
-- TBCW DATABASE — SCHEMA (вставить целиком в SQL Editor → Run)
-- ============================================================

-- Таблица профилей: роль + позывной каждого члена
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    callsign text not null unique,
    role text not null default 'base' check (role in ('guest', 'base', 'extended', 'admin')),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Хелпер: текущий пользователь — админ?
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
    select coalesce(
        (select role = 'admin' from public.profiles where id = auth.uid()),
        false
    );
$$;

-- Авто-создание профиля при добавлении юзера в дашборде:
-- callsign берётся из email (leone@tbcw.db -> leone), роль по умолчанию base
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, callsign, role)
    values (new.id, split_part(new.email, '@', 1), 'base')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Профили: свой ряд видит себе, админ видит все
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

drop policy if exists "profiles: admin reads all" on public.profiles;
create policy "profiles: admin reads all"
    on public.profiles for select
    to authenticated
    using (public.is_admin());

-- ============================================================
-- ПОСЛЕ ПРОГОНА SCHEMA (вручную, один раз):
--
-- 1) Свой админ-аккаунт создаётся в Authentication -> Users -> Add user:
--       email: admin@tbcw.db    password: ТВОЙ_КОД
--    Потом здесь же в SQL Editor:
       -- update public.profiles set role = 'admin' where callsign = 'admin';
--
-- 2) Гостевой общий аккаунт:
--       email: guest@tbcw.db     password: ГОСТЕВОЙ_КОД
       -- update public.profiles set role = 'guest' where callsign = 'guest';
--
-- 3) Authentication -> Providers -> Email -> выключить
--    "Allow new users to sign up" (аккаунты создаёшь только ты).
-- ============================================================
