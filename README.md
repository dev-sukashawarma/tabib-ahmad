# Tabib Ahmad — Webapp Keuangan & Stok

Aplikasi satu halaman (mobile-first) untuk mencatat pemasukan (amplop & produk),
pengeluaran (operasional & beli stok), serta stok barang dengan HPP & laba.
Backend: **Node.js + PostgreSQL 17**. Login email/password mendukung banyak akun dan data dipisahkan per `user_id`.

## Deployment Coolify

1. Buat PostgreSQL 17 private dan import `postgres-schema.sql`.
2. Deploy repository ini sebagai Application menggunakan `Dockerfile`.
3. Pasang persistent volume `/app/uploads`.
4. Isi environment variables berikut:

```env
DATABASE_URL=postgresql://...
ADMIN_EMAIL=admin@faedahsehat.com
ADMIN_USER_ID=136ca9d4-1919-4a7f-9664-8a0371681d65
ADMIN_PASSWORD=ganti-dengan-password-kuat
ALLOW_SIGNUP=false
NODE_ENV=production
```

Gunakan Internal PostgreSQL URL dari Coolify untuk `DATABASE_URL`. Jangan aktifkan public access database.

Untuk membuka pendaftaran akun baru, ubah sementara `ALLOW_SIGNUP=true`, buat akun, lalu kembalikan ke `false` dan redeploy.

## Catatan
- Session login disimpan sebagai cookie `HttpOnly`, `Secure`, dan `SameSite=Strict`.
- Setiap operasi database dibatasi oleh akun login pada backend.
- Tombol **Ekspor data** mengunduh cadangan JSON untuk backup.
- HPP = harga modal per produk (otomatis terisi dari harga beli terakhir, bisa diedit).
- Mode akuntansi: Laba = Pemasukan − HPP − Operasional. Stok belum terjual = aset.
- Desain mobile-first, herbal theme.
