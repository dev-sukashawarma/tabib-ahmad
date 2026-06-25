# Tabib Ahmad — Webapp Keuangan & Stok

Aplikasi satu halaman (mobile-first) untuk mencatat pemasukan (amplop & produk),
pengeluaran (operasional & beli stok), serta stok barang dengan HPP & laba.
Backend: **Supabase** (Postgres). **Tanpa login** — akses langsung, single-user.

## Setup (sekali saja)

1. **Buat tabel** — di Supabase: SQL Editor → tempel isi [`supabase-schema.sql`](supabase-schema.sql) → **Run**.
   (Tabel akan dibuat otomatis tanpa RLS.)

2. **Buat bucket storage** — Storage → **New Bucket** → nama `produk-images` → Public → Create.
   (Untuk upload gambar produk.)

3. **Isi kredensial** — di `index.html` bagian atas, ganti:
   - `SUPABASE_URL` → Project URL (contoh: `https://xxxx.supabase.co`)
   - `SUPABASE_ANON` → anon/public key (lihat Project Settings → API)

4. **Buka** `index.html` di browser (atau deploy ke hosting statis).
   → Langsung masuk ke aplikasi, tidak perlu login.

## Catatan
- Tanpa autentikasi — cocok untuk lokal/internal saja.
- Tombol **Ekspor data** mengunduh cadangan JSON untuk backup.
- HPP = harga modal per produk (otomatis terisi dari harga beli terakhir, bisa diedit).
- Mode akuntansi: Laba = Pemasukan − HPP − Operasional. Stok belum terjual = aset.
- Desain mobile-first, herbal theme.
