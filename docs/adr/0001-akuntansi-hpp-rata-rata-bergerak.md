# Pakai mode akuntansi dengan HPP rata-rata bergerak

Excel lama menghitung laba secara arus kas (semua uang masuk − semua uang keluar),
sehingga membeli stok dalam jumlah besar tampak sebagai "rugi" walau barang masih
ada. Kami memutuskan webapp memakai **mode akuntansi**: laba memperhitungkan HPP,
hanya biaya barang yang **terjual** yang jadi beban; stok yang belum terjual adalah
aset, bukan kerugian. HPP dihitung dengan **rata-rata bergerak (weighted average)**
dan **di-snapshot saat transaksi penjualan dibuat** sehingga edit transaksi lama
tidak menghitung ulang seluruh riwayat.

## Status

Superseded sebagian (25 Juni 2026): mode akuntansi (HPP sebagai beban, stok = aset)
tetap dipakai, TAPI metode rata-rata bergerak **dibatalkan demi kesederhanaan** untuk
pengguna non-teknis. HPP kini = harga modal per produk yang diisi manual (dan ikut
terisi otomatis dari harga beli terakhir), disnapshot saat penjualan.

## Considered options

- Arus kas murni (seperti Excel) — ditolak: menyesatkan saat ada stok besar; pemilik
  ingin perhitungan HPP.
- FIFO per batch — ditolak: perlu melacak sisa tiap batch pembelian, terlalu rumit
  untuk usaha kecil.
- Harga beli terakhir — ditolak: tidak akurat saat harga fluktuatif.
- Hitung ulang seluruh riwayat tiap edit — ditolak: lambat dan rumit; melanggar
  prinsip "sederhana".

## Consequences

- Perlu menyimpan HPP per penjualan dan nilai stok berjalan per produk.
- Sulit diubah belakangan tanpa merusak konsistensi angka historis.
- Edit/hapus transaksi lama tidak retroaktif ke HPP yang sudah tercatat; koreksi
  besar dilakukan dengan hapus & input ulang.
