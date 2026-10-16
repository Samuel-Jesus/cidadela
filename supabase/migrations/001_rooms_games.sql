-- Cidadela: salas + sync de partida (Supabase Realtime)
-- Rode no SQL Editor do Dashboard (ou via CLI).
-- Habilite Authentication → Providers → Anonymous antes de usar.

-- Salas -------------------------------------------------------------------

create table if not exists public.rooms (
  id text primary key check (char_length(id) = 6),
  host_id uuid not null references auth.users (id) on delete cascade,
  max_players int not null check (max_players between 2 and 8),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'ended')),
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id text not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  pawn_id text not null,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, pawn_id)
);

create table if not exists public.games (
  room_id text primary key references public.rooms (id) on delete cascade,
  version bigint not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_actions (
  id bigint generated always as identity primary key,
  room_id text not null references public.rooms (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists game_actions_room_pending_idx
  on public.game_actions (room_id, created_at)
  where applied = false;

-- Helpers RLS -------------------------------------------------------------

create or replace function public.is_room_member(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_room_host(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and r.host_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(text) from public;
revoke all on function public.is_room_host(text) from public;
grant execute on function public.is_room_member(text) to authenticated;
grant execute on function public.is_room_host(text) to authenticated;

-- RLS ---------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.games enable row level security;
alter table public.game_actions enable row level security;

-- rooms
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to authenticated
  using (public.is_room_member(id) or host_id = auth.uid());

drop policy if exists rooms_insert on public.rooms;
create policy rooms_insert on public.rooms
  for insert to authenticated
  with check (host_id = auth.uid());

drop policy if exists rooms_update on public.rooms;
create policy rooms_update on public.rooms
  for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- room_members: leitura por membros; insert próprio em waiting; host gerencia
drop policy if exists room_members_select on public.room_members;
create policy room_members_select on public.room_members
  for select to authenticated
  using (
    public.is_room_member(room_id)
    or public.is_room_host(room_id)
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.status = 'waiting'
    )
  );

drop policy if exists room_members_insert on public.room_members;
create policy room_members_insert on public.room_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_id and r.status = 'waiting'
    )
  );

drop policy if exists room_members_update on public.room_members;
create policy room_members_update on public.room_members
  for update to authenticated
  using (user_id = auth.uid() or public.is_room_host(room_id))
  with check (user_id = auth.uid() or public.is_room_host(room_id));

drop policy if exists room_members_delete on public.room_members;
create policy room_members_delete on public.room_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_room_host(room_id));

-- games
drop policy if exists games_select on public.games;
create policy games_select on public.games
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists games_insert on public.games;
create policy games_insert on public.games
  for insert to authenticated
  with check (public.is_room_host(room_id));

drop policy if exists games_update on public.games;
create policy games_update on public.games
  for update to authenticated
  using (public.is_room_host(room_id))
  with check (public.is_room_host(room_id));

-- game_actions: membros inserem; host lê/atualiza applied
drop policy if exists game_actions_select on public.game_actions;
create policy game_actions_select on public.game_actions
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists game_actions_insert on public.game_actions;
create policy game_actions_insert on public.game_actions
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and public.is_room_member(room_id)
  );

drop policy if exists game_actions_update on public.game_actions;
create policy game_actions_update on public.game_actions
  for update to authenticated
  using (public.is_room_host(room_id))
  with check (public.is_room_host(room_id));

-- Lookup de sala por código (convidado ainda não é membro) -----------------
-- Política extra: qualquer autenticado pode SELECT room waiting pelo id
-- (necessário para join). Membros/host já cobertos acima.

drop policy if exists rooms_select_waiting on public.rooms;
create policy rooms_select_waiting on public.rooms
  for select to authenticated
  using (status = 'waiting');

-- Realtime ----------------------------------------------------------------
-- Se a tabela já estiver na publication, ignore o erro "already member".

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.room_members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.games;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.game_actions;
exception when duplicate_object then null;
end $$;
