-- Lumen — Supabase schema
-- Run this in the Supabase dashboard SQL editor or via `supabase db push`

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id       uuid references auth.users on delete cascade primary key,
  name     text not null default '',
  email    text not null default '',
  initials text not null default '',
  updated_at timestamptz default now()
);

-- ─── Lists ───────────────────────────────────────────────────────────────────
create table if not exists lists (
  id         text primary key,
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  icon       text not null default 'list',
  color      text not null default '#6d5ef6',
  created_at timestamptz default now()
);

-- ─── Tags ────────────────────────────────────────────────────────────────────
create table if not exists tags (
  id         text primary key,
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  color      text not null,
  created_at timestamptz default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id           text primary key,
  user_id      uuid references auth.users on delete cascade not null,
  title        text not null,
  notes        text not null default '',
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  due          timestamptz,
  priority     text check (priority in ('high', 'med', 'low')),
  list_id      text references lists(id) on delete set null,
  -- subtasks stored as JSONB: [{ id, title, done }]
  subtasks     jsonb not null default '[]',
  recurring    text check (recurring in ('daily', 'weekdays', 'weekly', 'monthly')),
  archived     boolean not null default false,
  "order"      integer not null default 0
);

-- ─── Task ↔ Tag junction ──────────────────────────────────────────────────────
create table if not exists task_tags (
  task_id text references tasks(id) on delete cascade,
  tag_id  text references tags(id)  on delete cascade,
  primary key (task_id, tag_id)
);

-- ─── Settings ────────────────────────────────────────────────────────────────
create table if not exists settings (
  user_id   uuid references auth.users on delete cascade primary key,
  bg        text not null default 'aurora',
  custom_bg text,
  scrim     integer not null default 32,
  theme     text not null default 'light',
  accent    text not null default '#6d5ef6',
  sidebar   text not null default 'expanded'
);

-- ─── Completion history ───────────────────────────────────────────────────────
create table if not exists completion_history (
  user_id uuid references auth.users on delete cascade,
  date    date not null,
  count   integer not null default 0,
  primary key (user_id, date)
);

-- ─── RPC: upsert history count ───────────────────────────────────────────────
create or replace function increment_history(p_date date, p_delta integer)
returns void language plpgsql security definer as $$
begin
  insert into completion_history (user_id, date, count)
  values (auth.uid(), p_date, greatest(0, p_delta))
  on conflict (user_id, date)
  do update set count = greatest(0, completion_history.count + p_delta);
end;
$$;

-- ─── Auto-create profile + settings on sign-up ───────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, name, initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'initials', '')
  );
  insert into settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles           enable row level security;
alter table lists              enable row level security;
alter table tags               enable row level security;
alter table tasks              enable row level security;
alter table task_tags          enable row level security;
alter table settings           enable row level security;
alter table completion_history enable row level security;

create policy "own profile"  on profiles           using (id = auth.uid());
create policy "own lists"    on lists              using (user_id = auth.uid());
create policy "own tags"     on tags               using (user_id = auth.uid());
create policy "own tasks"    on tasks              using (user_id = auth.uid());
create policy "own settings" on settings           using (user_id = auth.uid());
create policy "own history"  on completion_history using (user_id = auth.uid());

-- task_tags: allow if the linked task belongs to the user
create policy "own task_tags" on task_tags
  using (
    exists (
      select 1 from tasks
      where tasks.id = task_tags.task_id
        and tasks.user_id = auth.uid()
    )
  );
