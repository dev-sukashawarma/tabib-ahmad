begin;

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  display_name text,
  is_active boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint accounts_email_normalized check (email = lower(trim(email)))
);

create unique index if not exists accounts_email_unique
  on public.accounts (lower(email));

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_account_id_idx on public.sessions(account_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

create table if not exists public.produk (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  nama text not null,
  kategori text default 'Lainnya',
  satuan text default 'pcs',
  hpp numeric default 0,
  harga_jual numeric default 0,
  stok_min numeric default 0,
  stok_awal numeric default 0,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.amplop (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  sumber text,
  jumlah numeric not null,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists public.jual (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  produk_id uuid references public.produk(id) on delete set null,
  qty numeric not null,
  harga numeric not null,
  hpp_snapshot numeric default 0,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists public.ops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  nama text not null,
  jumlah numeric not null,
  kategori text,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists public.beli (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  produk_id uuid references public.produk(id) on delete cascade,
  qty numeric not null,
  harga numeric not null,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists public.adj (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  produk_id uuid references public.produk(id) on delete cascade,
  delta numeric not null,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete cascade,
  tgl date not null,
  jenis text default 'Iklan',
  nama text,
  jumlah numeric not null,
  catatan text,
  created_at timestamptz default now()
);

create index if not exists produk_user_id_idx on public.produk(user_id);
create index if not exists amplop_user_id_idx on public.amplop(user_id);
create index if not exists jual_user_id_idx on public.jual(user_id);
create index if not exists ops_user_id_idx on public.ops(user_id);
create index if not exists beli_user_id_idx on public.beli(user_id);
create index if not exists adj_user_id_idx on public.adj(user_id);
create index if not exists ads_user_id_idx on public.ads(user_id);

commit;
