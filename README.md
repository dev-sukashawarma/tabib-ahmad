# Tabib Ahmad — Webapp Keuangan & Stok

Aplikasi satu halaman (mobile-first) untuk mencatat pemasukan (amplop & produk),
pengeluaran (operasional & beli stok), serta stok barang dengan HPP & laba.
Backend: **Supabase** (Postgres + Auth). Login: **email + password**.

## Setup (sekali saja)

1. **Buat tabel** — di Supabase: SQL Editor → tempel isi [`supabase-schema.sql`](supabase-schema.sql) → Run.
2. **Isi kredensial** — di `index.html` bagian atas, ganti:
   - `SUPABASE_URL` → Project URL
   - `SUPABASE_ANON` → anon/public key
   (Project Settings → API)
3. **Buat akun login** — Authentication → Users → **Add user** (isi email & password
   untuk Tabib Ahmad). Aplikasi sengaja tidak punya halaman daftar; akun dibuat di dashboard.
4. **Buka** `index.html` (atau deploy ke hosting statis / GitHub Pages).

## Catatan
- Semua data dilindungi Row Level Security — tiap user hanya melihat datanya sendiri.
- Tombol **Ekspor data** mengunduh cadangan JSON.
- HPP = harga modal per produk (otomatis terisi dari harga beli terakhir, bisa diedit).
