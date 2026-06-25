# PRD — Webapp Manajemen Keuangan & Stok "Tabib Ahmad"

**Versi:** 1.0
**Tanggal:** 25 Juni 2026
**Pemilik Produk:** Tabib Ahmad
**Status:** Draft (keputusan desain terkunci via sesi grilling 25 Juni 2026)

> Lihat [CONTEXT.md](CONTEXT.md) untuk glosarium istilah dan
> [ADR 0001](docs/adr/0001-akuntansi-hpp-rata-rata-bergerak.md) untuk keputusan akuntansi.

---

## 0. Keputusan Desain Terkunci

1. **Mode laba: akuntansi (bukan arus kas).** Laba memperhitungkan HPP; stok belum
   terjual = aset, bukan rugi.
2. **HPP: rata-rata bergerak (weighted average)**, di-snapshot saat penjualan dibuat.
3. **Input harga: qty × harga per unit**, total dihitung otomatis.
4. **Produk: master terpisah** dengan dropdown (+ tambah produk cepat dari form).
5. **Stok awal: mulai dari nol** — semua stok berasal dari pencatatan pembelian.
6. **Stok minus diizinkan** saat jual tanpa stok cukup; transaksi tidak pernah
   diblokir, HPP sementara = 0 + peringatan.
7. **Edit transaksi lama tidak retroaktif** ke HPP yang sudah tercatat.
8. **Penyimpanan: online** dengan login (backend + DB).
9. **Periode: satu basis data berkelanjutan**, bulan/tahun hanya filter; stok kontinu
   lintas bulan.

---

## 1. Latar Belakang

Saat ini pencatatan keuangan Tabib Ahmad dilakukan di file Excel bulanan
(`Lap Keuangan Tabib Ahmad`) yang terbagi menjadi 5 sheet: Dashboard, Pemasukan
Amplop, Pemasukan Produk, Pengeluaran Tabib, dan Pembelian Produk.

Masalah pendekatan Excel:
- Rekap manual, rawan salah hitung dan formula rusak.
- Sulit dipakai di HP saat melayani pasien/jualan.
- Stok produk tidak terlacak otomatis (beli vs jual tidak terhubung).
- Riwayat antar bulan terpisah-pisah di banyak file.

**Tujuan:** membuat webapp sederhana yang menggantikan Excel untuk mencatat
pemasukan, pengeluaran, dan stok barang, dengan dashboard otomatis.

---

## 2. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik |
|---|---|
| Pencatatan transaksi cepat | Input 1 transaksi < 15 detik |
| Laba/rugi otomatis | Dashboard update real-time tanpa rumus manual |
| Stok akurat | Stok berkurang otomatis saat jual, bertambah saat beli |
| Bisa dipakai di HP | Layout responsif (mobile-first) |
| Tidak kehilangan data | Semua data tersimpan & bisa diekspor |

**Non-tujuan (di luar lingkup v1):**
- Multi-cabang / multi-user dengan hak akses kompleks.
- Integrasi pembayaran / e-wallet.
- Akuntansi pajak / laporan SAK.

---

## 3. Pengguna

- **Tabib Ahmad (admin tunggal)** — mencatat semua transaksi, melihat laporan.
- (Opsional v2) **Asisten** — hanya input transaksi.

---

## 4. Konsep Data (diturunkan dari Excel)

### 4.1 Pemasukan
Dua jenis, dipisah agar laporan jelas:

**A. Pemasukan Amplop** (jasa & non-produk)
- Tanggal
- Keterangan / Sumber (ruqyah, bekam, infaq, donasi, dll)
- Jumlah (Rp)
- Catatan

**B. Pemasukan Produk** (penjualan barang)
- Tanggal
- Produk (relasi ke master Produk)
- Jumlah (qty)
- Harga Jual per unit (Rp) — total dihitung otomatis
- HPP snapshot (Rp) — diisi otomatis dari rata-rata bergerak saat simpan
- Catatan
- → **mengurangi stok** produk terkait (boleh minus, lihat §0.6)

### 4.2 Pengeluaran
**A. Pengeluaran Tabib** (operasional)
- Tanggal
- Nama Pengeluaran
- Jumlah (Rp)
- Kategori (Perlengkapan, Peralatan, Promosi, Operasional, Sosial, Renovasi, Jasa, dll)
- Catatan

**B. Pembelian Produk** (modal beli stok)
- Tanggal
- Produk (relasi ke master Produk)
- Jumlah Beli (qty)
- Harga Beli per unit (Rp) — total dihitung otomatis
- Catatan
- → **menambah stok** + memperbarui HPP rata-rata bergerak produk terkait

### 4.3 Master Produk (stok)
- Nama Produk (Aqua, Garam, Minyak, Luban, Sepron, dll)
- Satuan (pcs, botol, kg)
- Stok saat ini (otomatis dari pembelian − penjualan; mulai dari nol)
- HPP rata-rata bergerak berjalan (otomatis)
- Harga jual standar (opsional, untuk auto-isi form)
- Stok minimum (untuk peringatan stok menipis)

---

## 5. Fitur Utama (Scope v1)

### F1 — Dashboard
- Kartu ringkasan: Total Pemasukan (Amplop + Produk), Total HPP barang terjual,
  Total Pengeluaran Operasional, **Laba Bersih** = Pemasukan − HPP − Operasional.
- Catatan: pembelian stok TIDAK langsung mengurangi laba; hanya HPP barang terjual
  yang jadi beban (mode akuntansi, §0.1–0.2).
- Nilai aset stok berjalan (qty × HPP rata-rata).
- Filter periode (bulan/tahun) — hanya filter, bukan basis data terpisah.
- Grafik sederhana: pemasukan vs beban, pengeluaran per kategori.
- Peringatan stok menipis & stok minus.

### F2 — Pemasukan
- Tab "Amplop" dan "Produk".
- Tambah / edit / hapus transaksi.
- Tabel riwayat dengan filter tanggal & pencarian.
- Saat input penjualan produk → stok otomatis berkurang.

### F3 — Pengeluaran
- Tab "Operasional (Tabib)" dan "Pembelian Produk".
- Dropdown kategori untuk operasional.
- Saat input pembelian produk → stok otomatis bertambah.

### F4 — Stok Barang
- Daftar produk + stok terkini.
- Tambah/edit master produk & stok minimum.
- Indikator warna: hijau (aman), kuning (menipis), merah (habis).
- Riwayat pergerakan stok (masuk/keluar) per produk.

### F5 — Laporan & Ekspor
- Laporan bulanan ringkas (seperti Dashboard Excel).
- Ekspor ke Excel/CSV.

---

## 6. Alur Pengguna Inti

1. **Catat penjualan produk:** Pemasukan → Produk → pilih produk, qty, harga →
   simpan → stok berkurang, dashboard terupdate.
2. **Catat jasa:** Pemasukan → Amplop → isi sumber & jumlah → simpan.
3. **Catat belanja stok:** Pengeluaran → Pembelian Produk → pilih produk, qty,
   harga beli → simpan → stok bertambah.
4. **Catat operasional:** Pengeluaran → Tabib → isi nama, jumlah, kategori.
5. **Lihat hasil:** buka Dashboard, pilih bulan, lihat laba/rugi & stok menipis.

---

## 7. Kebutuhan Non-Fungsional

- **Responsif / mobile-first** — utama dipakai di HP.
- **Bahasa Indonesia**, format Rupiah (Rp #.###).
- **Online** dengan login (akses dari perangkat mana saja, data tersinkron).
- **Backup/ekspor** data mudah (Excel/CSV).
- **Sederhana** — minim klik, cocok untuk pengguna non-teknis.

---

## 8. Saran Teknis (ringan & sederhana)

- **Frontend:** React + Tailwind — mobile-first.
- **Backend/DB:** **Supabase** (Postgres + auth + API instan) — sesuai keputusan
  "online dengan login". Auth single admin (Tabib Ahmad).
- **Skema tabel:** `produk` (qty stok + hpp_rata2 berjalan), `pemasukan_amplop`,
  `pemasukan_produk` (simpan hpp_snapshot), `pengeluaran_tabib`, `pembelian_produk`.
- **Logika kunci:**
  - Pembelian produk → tambah qty, hitung ulang `hpp_rata2 = (nilai_stok_lama +
    qty_beli × harga_beli) ÷ (qty_lama + qty_beli)`.
  - Penjualan produk → kurangi qty, simpan `hpp_snapshot = hpp_rata2` saat itu
    (0 jika stok belum pernah dibeli).
  - Laba = Σ pemasukan − Σ hpp_snapshot − Σ pengeluaran operasional.

---

## 9. Rencana Rilis

| Tahap | Isi |
|---|---|
| MVP (v1) | F1–F4 dasar, Supabase + login admin, HPP rata-rata bergerak |
| v1.1 | F5 ekspor Excel/CSV, grafik |
| v2 | Asisten (role input-only), PWA offline, impor data Excel lama |

---

## 10. Pertanyaan Terbuka (sisa)

1. Perlu impor data historis dari Excel bulan-bulan lama? (saat ini ditunda ke v2)
2. Satuan produk: kelola daftar satuan baku (botol/pcs/kg) atau ketik bebas?
3. Apakah "harga jual standar" per produk perlu dikunci atau hanya saran auto-isi?
