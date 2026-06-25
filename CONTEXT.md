# CONTEXT — Glossary Tabib Ahmad

Glosarium istilah domain untuk webapp manajemen keuangan & stok Tabib Ahmad.
Hanya istilah & makna — bukan keputusan implementasi.

## Istilah

### Pemasukan Amplop
Uang masuk dari jasa & non-produk: ruqyah, bekam, infaq, donasi. Tidak terkait stok.

### Pemasukan Produk
Uang masuk dari penjualan barang. Setiap transaksi mengurangi stok produk terkait.

### Orderan Produk
Satu penjualan yang berisi beberapa Produk sekaligus (multi-item) dengan satu Tanggal.
Total Bayar dijumlah otomatis dari tiap item (qty × harga jual). Saat disimpan, tiap
item menjadi satu Pemasukan Produk (stok masing-masing berkurang). Produk baru boleh
dibuat langsung di dalam orderan bila belum ada.

### Pengeluaran Tabib
Uang keluar untuk operasional usaha (perlengkapan, peralatan, promosi, renovasi,
sosial, jasa). Tidak terkait stok. Punya Kategori.

### Pembelian Produk
Uang keluar untuk membeli stok produk yang akan dijual. Menambah stok dan
menjadi dasar HPP.

### Produk
Barang yang dibeli untuk dijual (Aqua, Garam, Minyak, Luban, Sepron, dll).
Punya stok (qty), nilai HPP, dan gambar (optional, jpg/png, max 5MB).
Gambar disimpan di Supabase Storage bucket `produk-images`, ditampilkan sebagai
thumbnail di daftar stok & preview saat edit produk.

### HPP (Harga Pokok Penjualan / COGS)
Biaya perolehan barang **yang terjual saja**. Dipakai untuk menghitung laba kotor
produk = Harga Jual − HPP. Barang yang belum terjual tetap menjadi aset stok,
bukan kerugian. **HPP = harga modal per produk yang diisi manual** (disederhanakan
untuk pengguna non-teknis): ada di field produk, juga ikut terisi otomatis dari
harga beli terakhir. Saat menjual, HPP produk disnapshot ke transaksi penjualan.
(Metode rata-rata bergerak sebelumnya dibatalkan demi kesederhanaan.)

### Periode
Bukan file/basis data terpisah per bulan. Semua transaksi dalam satu basis data
berkelanjutan; bulan/tahun hanya filter pada laporan. Stok dan HPP rata-rata
berjalan kontinu lintas bulan.

### Stok Minus
Penjualan tidak pernah diblokir. Jika produk dijual saat stok belum cukup (mis.
pembelian belum dicatat), transaksi tetap tersimpan, stok boleh minus dan tampil
sebagai peringatan, HPP transaksi itu sementara = 0 sampai pembelian dicatat.
Prinsip: jangan pernah menghalangi pencatatan uang masuk.

### Laba / Rugi
Mode **akuntansi** (bukan arus kas murni). Laba memperhitungkan HPP: hanya biaya
barang yang sudah terjual yang dihitung sebagai beban. Stok yang belum terjual
adalah aset, tidak mengurangi laba.
