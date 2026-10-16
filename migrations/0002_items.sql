-- The example resource: one CRUD table, scoped to the signed-in user.

create table if not exists items (
  id text not null primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_id_idx on items (user_id);
