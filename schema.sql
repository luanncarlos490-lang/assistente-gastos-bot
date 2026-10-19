-- Rode no SQL Editor do Supabase

create table customers (
  phone text primary key,            -- so digitos, ex: 5598999999999
  name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table transactions (
  id bigint generated always as identity primary key,
  phone text not null references customers(phone) on delete cascade,
  type text not null check (type in ('in','out')),
  value numeric(12,2) not null check (value > 0),
  description text,
  category text,
  date date not null,
  created_at timestamptz not null default now()
);
create index on transactions (phone, date);

-- evita processar duas vezes a mesma mensagem (a Meta reenvia se demorar)
create table processed_messages (
  id text primary key,
  created_at timestamptz not null default now()
);

alter table customers enable row level security;
alter table transactions enable row level security;
alter table processed_messages enable row level security;
-- sem policies: so a chave service_role (servidor) acessa.
