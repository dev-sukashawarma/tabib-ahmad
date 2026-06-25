-- ============================================================
--  Tabib Ahmad — Skema Supabase (jalankan di SQL Editor Supabase)
--  Aplikasi single-user: semua baris dimiliki oleh user yang login.
-- ============================================================

-- ---------- PRODUK (master barang + stok) ----------
create table if not exists produk (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nama        text not null,
  kategori    text default 'Lainnya',
  satuan      text default 'pcs',
  hpp         numeric default 0,         -- harga modal per unit
  harga_jual  numeric default 0,
  stok_min    numeric default 0,
  stok_awal   numeric default 0,
  created_at  timestamptz default now()
);

-- ---------- PEMASUKAN AMPLOP (jasa/donasi) ----------
create table if not exists amplop (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tgl         date not null,
  sumber      text,
  jumlah      numeric not null,
  catatan     text,
  created_at  timestamptz default now()
);

-- ---------- PEMASUKAN PRODUK (penjualan) ----------
create table if not exists jual (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tgl          date not null,
  produk_id    uuid references produk(id) on delete set null,
  qty          numeric not null,
  harga        numeric not null,         -- harga jual per unit
  hpp_snapshot numeric default 0,        -- modal saat dijual (untuk hitung laba)
  catatan      text,
  created_at   timestamptz default now()
);

-- ---------- PENGELUARAN TABIB (operasional) ----------
create table if not exists ops (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tgl         date not null,
  nama        text not null,
  jumlah      numeric not null,
  kategori    text,
  catatan     text,
  created_at  timestamptz default now()
);

-- ---------- PEMBELIAN PRODUK (modal beli stok) ----------
create table if not exists beli (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tgl         date not null,
  produk_id   uuid references produk(id) on delete cascade,
  qty         numeric not null,
  harga       numeric not null,          -- harga beli per unit
  catatan     text,
  created_at  timestamptz default now()
);

-- ---------- PENYESUAIAN STOK (opname) ----------
create table if not exists adj (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tgl         date not null,
  produk_id   uuid references produk(id) on delete cascade,
  delta       numeric not null,          -- selisih (stok fisik - stok sistem)
  catatan     text,
  created_at  timestamptz default now()
);

-- ============================================================
--  Row Level Security: tiap user hanya melihat datanya sendiri
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['produk','amplop','jual','ops','beli','adj'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists own_rows on %I;', t);
    execute format($f$
      create policy own_rows on %I
        for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;
