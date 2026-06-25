# Tabib Ahmad — Webapp Keuangan & Stok

Aplikasi satu halaman (mobile-first) untuk mencatat pemasukan (amplop & produk),
pengeluaran (operasional & beli stok), serta stok barang dengan HPP & laba.
Backend: **Supabase** (Postgres + Auth). **Login email + password** — multi-user, data terpisah per user.

## Setup (sekali saja)

1. **Buat tabel & enable auth** — di Supabase: SQL Editor → tempel isi [`supabase-schema.sql`](supabase-schema.sql) → **Run**.
   (Tabel dibuat dengan RLS enabled — setiap user hanya akses datanya sendiri.)

2. **Buat bucket storage** — Storage → **New Bucket** → nama `produk-images` → Public → Create.
   (Untuk upload gambar produk.)

3. **Isi kredensial** — di `index.html` bagian atas, ganti:
   - `SUPABASE_URL` → Project URL (contoh: `https://xxxx.supabase.co`)
   - `SUPABASE_ANON` → anon/public key (lihat Project Settings → API)

4. **Buka** `index.html` di browser.
   → Halaman login muncul. **Daftar akun baru** atau login.
   → Setiap user punya data terpisah, aman dengan RLS.

## Catatan
- Tanpa autentikasi — cocok untuk lokal/internal saja.
- Tombol **Ekspor data** mengunduh cadangan JSON untuk backup.
- HPP = harga modal per produk (otomatis terisi dari harga beli terakhir, bisa diedit).
- Mode akuntansi: Laba = Pemasukan − HPP − Operasional. Stok belum terjual = aset.
- Desain mobile-first, herbal theme.
