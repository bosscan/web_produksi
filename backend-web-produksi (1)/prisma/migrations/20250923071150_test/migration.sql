-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "data_konsumen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_pemesan" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "nomer_hp" INTEGER NOT NULL,
    "konten" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "data_pesanan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "format_nama" TEXT NOT NULL,
    "tipe_transaksi" TEXT NOT NULL,
    "nominal_transaksi" REAL NOT NULL,
    "bukti_transaksi" BLOB NOT NULL,
    "id_pemesan" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_pesanan_id_pemesan_fkey" FOREIGN KEY ("id_pemesan") REFERENCES "data_konsumen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "list_pesanan" (
    "id_data_pesanan" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "format_nama" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "list_pesanan_id_data_pesanan_size_nama_format_nama_fkey" FOREIGN KEY ("id_data_pesanan", "size", "nama", "format_nama") REFERENCES "data_pesanan" ("id", "size", "nama", "format_nama") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_input_desain" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "no_spk" TEXT NOT NULL,
    "nama_pemesan" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "tipe_transaksi" TEXT NOT NULL,
    "id_cs" INTEGER NOT NULL,
    "nama_cs" TEXT NOT NULL,
    "tanggal_input_pesanan" DATETIME NOT NULL,
    CONSTRAINT "antrian_input_desain_quantity_tipe_transaksi_tanggal_input_pesanan_fkey" FOREIGN KEY ("quantity", "tipe_transaksi", "tanggal_input_pesanan") REFERENCES "data_pesanan" ("quantity", "tipe_transaksi", "created_at") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_input_desain_nama_pemesan_fkey" FOREIGN KEY ("nama_pemesan") REFERENCES "data_konsumen" ("nama_pemesan") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_input_desain_id_cs_nama_cs_fkey" FOREIGN KEY ("id_cs", "nama_cs") REFERENCES "user" ("id", "nama") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "input_desain" (
    "no_spk" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "sample" TEXT NOT NULL,
    "jenis_produk" TEXT NOT NULL,
    "jenis_pola" TEXT NOT NULL,
    "jenis_kain" TEXT NOT NULL,
    "warna_kain" TEXT NOT NULL,
    "kombinasi_warna" TEXT NOT NULL,
    "kode_warna" TEXT NOT NULL,
    "aplikasi" TEXT NOT NULL,
    "jenis_bordir" TEXT NOT NULL,
    "jenis_sablon" TEXT NOT NULL,
    "hoodie" TEXT NOT NULL,
    "potongan_bawah" TEXT NOT NULL,
    "belahan_samping" TEXT NOT NULL,
    "kerah" TEXT NOT NULL,
    "plaket" TEXT NOT NULL,
    "saku" TEXT NOT NULL,
    "saku_bawah" TEXT NOT NULL,
    "saku_furing" TEXT NOT NULL,
    "ujung_lengan" TEXT NOT NULL,
    "kancing_depan" TEXT NOT NULL,
    "tali_tambahan" TEXT NOT NULL,
    "tali_lengan" TEXT NOT NULL,
    "ban_bawah" TEXT NOT NULL,
    "skoder" TEXT NOT NULL,
    "varian_saku" TEXT NOT NULL,
    "jenis_reflektor" TEXT NOT NULL,
    "warna_list_reflektor" TEXT NOT NULL,
    "ventilasi" TEXT NOT NULL,
    "tempat_pulpen" TEXT NOT NULL,
    "lidah_kucing" TEXT NOT NULL,
    "tempat_lanyard" TEXT NOT NULL,
    "gantungan_ht" TEXT NOT NULL,
    "atribut_dada_kanan" BLOB NOT NULL,
    "ukuran_dada_kanan" INTEGER NOT NULL,
    "jarak_dada_kanan" TEXT NOT NULL,
    "keterangan_dada_kanan" TEXT NOT NULL,
    "atribut_dada_kiri" BLOB NOT NULL,
    "ukuran_dada_kiri" INTEGER NOT NULL,
    "jarak_dada_kiri" TEXT NOT NULL,
    "keterangan_dada_kiri" TEXT NOT NULL,
    "atribut_lengan_kanan" BLOB NOT NULL,
    "ukuran_lengan_kanan" INTEGER NOT NULL,
    "jarak_lengan_kanan" TEXT NOT NULL,
    "keterangan_lengan_kanan" TEXT NOT NULL,
    "atribut_lengan_kiri" BLOB NOT NULL,
    "ukuran_lengan_kiri" INTEGER NOT NULL,
    "jarak_lengan_kiri" TEXT NOT NULL,
    "keterangan_lengan_kiri" TEXT NOT NULL,
    "atribut_belakang" BLOB NOT NULL,
    "ukuran_belakang" INTEGER NOT NULL,
    "jarak_belakang" TEXT NOT NULL,
    "keterangan_belakang" TEXT NOT NULL,
    "atribut_tambahan" BLOB NOT NULL,
    "ukuran_tambahan" INTEGER NOT NULL,
    "jarak_tambahan" TEXT NOT NULL,
    "keterangan_tambahan" TEXT NOT NULL,
    "atribut_referensi" BLOB NOT NULL,
    "ukuran_referensi" INTEGER NOT NULL,
    "jarak_referensi" TEXT NOT NULL,
    "keterangan_referensi" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "input_desain_no_spk_fkey" FOREIGN KEY ("no_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_pengerjaan_desain" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_rekap_custom" TEXT NOT NULL,
    "no_spk" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "tanggal_input_desain" DATETIME NOT NULL,
    "nama_cs" TEXT NOT NULL,
    "status_desain" TEXT NOT NULL,
    "view_mockup" BLOB NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_pengerjaan_desain_no_spk_fkey" FOREIGN KEY ("no_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pengerjaan_desain_nama_desain_tanggal_input_desain_fkey" FOREIGN KEY ("nama_desain", "tanggal_input_desain") REFERENCES "input_desain" ("nama_desain", "created_at") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pengerjaan_desain_nama_cs_fkey" FOREIGN KEY ("nama_cs") REFERENCES "user" ("nama") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "keranjang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_rekap" TEXT NOT NULL,
    "id_spk" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "nama_konsumen" TEXT NOT NULL,
    "kuantity" INTEGER NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "keranjang_id_rekap_id_custom_fkey" FOREIGN KEY ("id_rekap", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keranjang_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "database_konsumen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "database_trend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jenis_produk" TEXT NOT NULL,
    "jenis_pola" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "updatedAt" TEXT
);

-- CreateTable
CREATE TABLE "plotting_rekap_bordir_queue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "kuantity" INTEGER,
    "status_desain" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plotting_rekap_bordir_queue_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "plotting_rekap_bordir_queue_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "method_rekap_bordir" (
    "rekap_id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "method_rekap_bordir_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rekap_id" TEXT NOT NULL,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "kuantity" INTEGER,
    "status_desain" TEXT,
    CONSTRAINT "method_rekap_bordir_item_rekap_id_fkey" FOREIGN KEY ("rekap_id") REFERENCES "method_rekap_bordir" ("rekap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "method_rekap_bordir_item_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "method_rekap_bordir_item_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spk_pipeline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "selesai_desain_produksi" TEXT,
    "selesai_cutting_pola" TEXT,
    "selesai_stock_bordir" TEXT,
    "selesai_bordir" TEXT,
    "selesai_setting" TEXT,
    "selesai_stock_jahit" TEXT,
    "selesai_finishing" TEXT,
    "selesai_foto_produk" TEXT,
    "selesai_stock_no_transaksi" TEXT,
    "selesai_pelunasan" TEXT,
    "selesai_pengiriman" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "spk_pipeline_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "spk_pipeline_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_desain_produksi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_desain_produksi_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_desain_produksi_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "omset_pendapatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tanggal" TEXT NOT NULL,
    "tipe_transaksi" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "id_spk" TEXT,
    "id_rekap_custom" TEXT,
    "id_custom" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "report_date_key" TEXT,
    CONSTRAINT "omset_pendapatan_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "omset_pendapatan_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "omset_pendapatan_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_pendapatan_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_ongkir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "ekspedisi" TEXT NOT NULL,
    "resi" TEXT NOT NULL,
    "tujuan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_ongkir_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_ongkir_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_fee_jaringan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_fee_jaringan_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_fee_jaringan_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_gaji" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "employee" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "base" INTEGER NOT NULL,
    "overtime" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "deduction" INTEGER NOT NULL,
    "notes" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_gaji_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_gaji_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_belanja_logistik" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "notes" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_belanja_logistik_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_belanja_logistik_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_maintenance_mesin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "work" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_maintenance_mesin_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_maintenance_mesin_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_overhead_pabrik" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_overhead_pabrik_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_overhead_pabrik_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengeluaran_marketing_ads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "platform" TEXT,
    "campaign" TEXT,
    "spend" INTEGER NOT NULL,
    "note" TEXT,
    "report_date_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengeluaran_marketing_ads_report_date_key_fkey" FOREIGN KEY ("report_date_key") REFERENCES "report_marketing_ads_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_fee_jaringan_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_fee_jaringan_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_gaji_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_gaji_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_ongkir_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_ongkir_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_belanja_logistik_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_belanja_logistik_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_belanja_logistik_kategori_bulanan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_maintenance_mesin_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_maintenance_mesin_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_overhead_pabrik_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_overhead_pabrik_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_marketing_ads_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_marketing_ads_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_pendapatan_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "dp" INTEGER,
    "pelunasan" INTEGER,
    "dpl" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "konsolidasi_date_key" TEXT,
    CONSTRAINT "report_pendapatan_harian_konsolidasi_date_key_fkey" FOREIGN KEY ("konsolidasi_date_key") REFERENCES "konsolidasi_harian" ("date") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "konsolidasi_harian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "income_total" INTEGER NOT NULL,
    "expense_total" INTEGER NOT NULL,
    "net_total" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "antrian_cutting_pola" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_cutting_pola_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_cutting_pola_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_stock_bordir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_stock_bordir_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_stock_bordir_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_bordir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_bordir_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_bordir_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_setting_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_setting_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_stock_jahit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_stock_jahit_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_stock_jahit_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_jahit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_jahit_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_jahit_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_finishing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_finishing_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_finishing_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_foto_produk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_foto_produk_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_foto_produk_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_stock_no_transaksi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_stock_no_transaksi_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_stock_no_transaksi_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_pelunasan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_pelunasan_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pelunasan_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_pengiriman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_spk" TEXT NOT NULL,
    "id_transaksi" TEXT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT,
    "jenis_pola" TEXT,
    "tanggal_input" TEXT,
    "kuantity" INTEGER,
    "status" TEXT,
    "masuk_at" TEXT,
    "selesai_at" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_pengiriman_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pengiriman_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "database_produk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_spk" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    CONSTRAINT "database_produk_id_spk_fkey" FOREIGN KEY ("id_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "database_sebaran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "jumlah_konsumen" TEXT NOT NULL,
    "total_pesanan" TEXT NOT NULL,
    "updatedAt" TEXT
);

-- CreateTable
CREATE TABLE "sebaran_konsumen" (
    "sebaran_id" INTEGER NOT NULL,
    "konsumen_id" INTEGER NOT NULL,

    PRIMARY KEY ("sebaran_id", "konsumen_id"),
    CONSTRAINT "sebaran_konsumen_sebaran_id_fkey" FOREIGN KEY ("sebaran_id") REFERENCES "database_sebaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sebaran_konsumen_konsumen_id_fkey" FOREIGN KEY ("konsumen_id") REFERENCES "data_konsumen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sebaran_pesanan" (
    "sebaran_id" INTEGER NOT NULL,
    "no_spk" TEXT NOT NULL,

    PRIMARY KEY ("sebaran_id", "no_spk"),
    CONSTRAINT "sebaran_pesanan_sebaran_id_fkey" FOREIGN KEY ("sebaran_id") REFERENCES "database_sebaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sebaran_pesanan_no_spk_fkey" FOREIGN KEY ("no_spk") REFERENCES "antrian_input_desain" ("no_spk") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_pra_produksi" (
    "id_rekap_custom" TEXT NOT NULL PRIMARY KEY,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT NOT NULL,
    "jenis_pola" TEXT NOT NULL,
    "tanggal_input_desain" DATETIME NOT NULL,
    "nama_cs" TEXT NOT NULL,
    "asset_desain" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_pra_produksi_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pra_produksi_nama_cs_fkey" FOREIGN KEY ("nama_cs") REFERENCES "user" ("nama") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pra_produksi_nama_desain_tanggal_input_desain_fkey" FOREIGN KEY ("nama_desain", "tanggal_input_desain") REFERENCES "input_desain" ("nama_desain", "created_at") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_pengerjaan_desain_pra_produksi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_rekap_custom" TEXT NOT NULL,
    "id_spk" TEXT,
    "id_custom" TEXT NOT NULL,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT NOT NULL,
    "jenis_pola" TEXT NOT NULL,
    "tanggal_input_desain" DATETIME NOT NULL,
    "nama_cs" TEXT NOT NULL,
    "asset_desain" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "link_drive_input_cs" TEXT,
    "link_drive_asset_jadi" TEXT,
    "catatan" TEXT,
    "worksheet" BLOB,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_pengerjaan_desain_pra_produksi_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pengerjaan_desain_pra_produksi_nama_cs_fkey" FOREIGN KEY ("nama_cs") REFERENCES "user" ("nama") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_pengerjaan_desain_pra_produksi_nama_desain_tanggal_input_desain_fkey" FOREIGN KEY ("nama_desain", "tanggal_input_desain") REFERENCES "input_desain" ("nama_desain", "created_at") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "antrian_revisi_pra_produksi" (
    "id_rekap_custom" TEXT NOT NULL,
    "id_custom" TEXT NOT NULL,
    "id_spk" TEXT,
    "nama_desain" TEXT NOT NULL,
    "jenis_produk" TEXT NOT NULL,
    "jenis_pola" TEXT NOT NULL,
    "tanggal_input_desain" DATETIME NOT NULL,
    "nama_cs" TEXT NOT NULL,
    "revisi_catatan" TEXT,
    "status" TEXT,
    "link_drive_input_cs" TEXT,
    "link_drive_asset_jadi" TEXT,
    "catatan" TEXT,
    "worksheet" BLOB,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "antrian_revisi_pra_produksi_id_rekap_custom_id_custom_fkey" FOREIGN KEY ("id_rekap_custom", "id_custom") REFERENCES "antrian_pengerjaan_desain" ("id_rekap_custom", "id_custom") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_revisi_pra_produksi_nama_cs_fkey" FOREIGN KEY ("nama_cs") REFERENCES "user" ("nama") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "antrian_revisi_pra_produksi_nama_desain_tanggal_input_desain_fkey" FOREIGN KEY ("nama_desain", "tanggal_input_desain") REFERENCES "input_desain" ("nama_desain", "created_at") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_nama_key" ON "user"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "user_cs" ON "user"("id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "data_konsumen_nama_pemesan_key" ON "data_konsumen"("nama_pemesan");

-- CreateIndex
CREATE UNIQUE INDEX "data_pesanan_quantity_tipe_created" ON "data_pesanan"("quantity", "tipe_transaksi", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_pesanan_unique" ON "data_pesanan"("size", "nama", "format_nama", "id");

-- CreateIndex
CREATE UNIQUE INDEX "data_pesanan_list" ON "list_pesanan"("size", "nama", "format_nama", "id_data_pesanan");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_input_desain_pesanan" ON "antrian_input_desain"("quantity", "tanggal_input_pesanan");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_input_desain_pemesan" ON "antrian_input_desain"("nama_pemesan");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_input_desain_cs" ON "antrian_input_desain"("nama_cs");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_input_desain_spk" ON "antrian_input_desain"("no_spk");

-- CreateIndex
CREATE UNIQUE INDEX "spesifikasi_desain_nama" ON "input_desain"("nama_desain", "jenis_produk", "jenis_pola");

-- CreateIndex
CREATE UNIQUE INDEX "spesifikasi_desain_created_at" ON "input_desain"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "spesifikasi_desain_nama_created_at" ON "input_desain"("nama_desain", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "input_desain_nama_desain_created_at_jenis_pola_jenis_produk_key" ON "input_desain"("nama_desain", "created_at", "jenis_pola", "jenis_produk");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_pengerjaan_desain_id_rekap_custom_id_custom_key" ON "antrian_pengerjaan_desain"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE UNIQUE INDEX "keranjang_unique_rekap" ON "keranjang"("id_rekap");

-- CreateIndex
CREATE UNIQUE INDEX "database_konsumen_telepon_key" ON "database_konsumen"("telepon");

-- CreateIndex
CREATE INDEX "database_trend_jenis_produk_idx" ON "database_trend"("jenis_produk");

-- CreateIndex
CREATE INDEX "database_trend_jenis_pola_idx" ON "database_trend"("jenis_pola");

-- CreateIndex
CREATE UNIQUE INDEX "plotting_rekap_bordir_queue_id_spk_key" ON "plotting_rekap_bordir_queue"("id_spk");

-- CreateIndex
CREATE INDEX "plotting_rekap_bordir_queue_nama_desain_idx" ON "plotting_rekap_bordir_queue"("nama_desain");

-- CreateIndex
CREATE INDEX "method_rekap_bordir_item_id_spk_idx" ON "method_rekap_bordir_item"("id_spk");

-- CreateIndex
CREATE UNIQUE INDEX "method_rekap_bordir_item_unique" ON "method_rekap_bordir_item"("rekap_id", "id_spk");

-- CreateIndex
CREATE UNIQUE INDEX "spk_pipeline_id_spk_key" ON "spk_pipeline"("id_spk");

-- CreateIndex
CREATE INDEX "spk_pipeline_id_transaksi_idx" ON "spk_pipeline"("id_transaksi");

-- CreateIndex
CREATE INDEX "spk_pipeline_nama_desain_idx" ON "spk_pipeline"("nama_desain");

-- CreateIndex
CREATE INDEX "spk_pipeline_jenis_produk_idx" ON "spk_pipeline"("jenis_produk");

-- CreateIndex
CREATE INDEX "spk_pipeline_jenis_pola_idx" ON "spk_pipeline"("jenis_pola");

-- CreateIndex
CREATE UNIQUE INDEX "spk_pipeline_recap_custom_unique" ON "spk_pipeline"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_desain_produksi_id_spk_idx" ON "antrian_desain_produksi"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_desain_produksi_id_transaksi_idx" ON "antrian_desain_produksi"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_desain_produksi_unique" ON "antrian_desain_produksi"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "omset_pendapatan_tanggal_idx" ON "omset_pendapatan"("tanggal");

-- CreateIndex
CREATE INDEX "omset_pendapatan_tipe_transaksi_idx" ON "omset_pendapatan"("tipe_transaksi");

-- CreateIndex
CREATE INDEX "omset_pendapatan_report_date_key_idx" ON "omset_pendapatan"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_ongkir_date_idx" ON "pengeluaran_ongkir"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_ongkir_report_date_key_idx" ON "pengeluaran_ongkir"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_fee_jaringan_date_idx" ON "pengeluaran_fee_jaringan"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_fee_jaringan_partner_idx" ON "pengeluaran_fee_jaringan"("partner");

-- CreateIndex
CREATE INDEX "pengeluaran_fee_jaringan_report_date_key_idx" ON "pengeluaran_fee_jaringan"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_gaji_date_idx" ON "pengeluaran_gaji"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_gaji_employee_idx" ON "pengeluaran_gaji"("employee");

-- CreateIndex
CREATE INDEX "pengeluaran_gaji_division_idx" ON "pengeluaran_gaji"("division");

-- CreateIndex
CREATE INDEX "pengeluaran_gaji_report_date_key_idx" ON "pengeluaran_gaji"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_belanja_logistik_date_idx" ON "pengeluaran_belanja_logistik"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_belanja_logistik_category_idx" ON "pengeluaran_belanja_logistik"("category");

-- CreateIndex
CREATE INDEX "pengeluaran_belanja_logistik_report_date_key_idx" ON "pengeluaran_belanja_logistik"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_maintenance_mesin_date_idx" ON "pengeluaran_maintenance_mesin"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_maintenance_mesin_machine_idx" ON "pengeluaran_maintenance_mesin"("machine");

-- CreateIndex
CREATE INDEX "pengeluaran_maintenance_mesin_vendor_idx" ON "pengeluaran_maintenance_mesin"("vendor");

-- CreateIndex
CREATE INDEX "pengeluaran_maintenance_mesin_report_date_key_idx" ON "pengeluaran_maintenance_mesin"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_overhead_pabrik_date_idx" ON "pengeluaran_overhead_pabrik"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_overhead_pabrik_category_idx" ON "pengeluaran_overhead_pabrik"("category");

-- CreateIndex
CREATE INDEX "pengeluaran_overhead_pabrik_report_date_key_idx" ON "pengeluaran_overhead_pabrik"("report_date_key");

-- CreateIndex
CREATE INDEX "pengeluaran_marketing_ads_date_idx" ON "pengeluaran_marketing_ads"("date");

-- CreateIndex
CREATE INDEX "pengeluaran_marketing_ads_platform_idx" ON "pengeluaran_marketing_ads"("platform");

-- CreateIndex
CREATE INDEX "pengeluaran_marketing_ads_report_date_key_idx" ON "pengeluaran_marketing_ads"("report_date_key");

-- CreateIndex
CREATE UNIQUE INDEX "report_fee_jaringan_harian_date_key" ON "report_fee_jaringan_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_gaji_harian_date_key" ON "report_gaji_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_ongkir_harian_date_key" ON "report_ongkir_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_belanja_logistik_harian_date_key" ON "report_belanja_logistik_harian"("date");

-- CreateIndex
CREATE INDEX "report_belanja_logistik_kategori_bulanan_month_idx" ON "report_belanja_logistik_kategori_bulanan"("month");

-- CreateIndex
CREATE INDEX "report_belanja_logistik_kategori_bulanan_category_idx" ON "report_belanja_logistik_kategori_bulanan"("category");

-- CreateIndex
CREATE UNIQUE INDEX "belanja_kategori_bulanan_unique" ON "report_belanja_logistik_kategori_bulanan"("month", "category");

-- CreateIndex
CREATE UNIQUE INDEX "report_maintenance_mesin_harian_date_key" ON "report_maintenance_mesin_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_overhead_pabrik_harian_date_key" ON "report_overhead_pabrik_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_marketing_ads_harian_date_key" ON "report_marketing_ads_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "report_pendapatan_harian_date_key" ON "report_pendapatan_harian"("date");

-- CreateIndex
CREATE UNIQUE INDEX "konsolidasi_harian_date_key" ON "konsolidasi_harian"("date");

-- CreateIndex
CREATE INDEX "antrian_cutting_pola_id_spk_idx" ON "antrian_cutting_pola"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_cutting_pola_id_transaksi_idx" ON "antrian_cutting_pola"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_cutting_pola_unique" ON "antrian_cutting_pola"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_stock_bordir_id_spk_idx" ON "antrian_stock_bordir"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_stock_bordir_id_transaksi_idx" ON "antrian_stock_bordir"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_stock_bordir_unique" ON "antrian_stock_bordir"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_bordir_id_spk_idx" ON "antrian_bordir"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_bordir_id_transaksi_idx" ON "antrian_bordir"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_bordir_unique" ON "antrian_bordir"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_setting_id_spk_idx" ON "antrian_setting"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_setting_id_transaksi_idx" ON "antrian_setting"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_setting_unique" ON "antrian_setting"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_stock_jahit_id_spk_idx" ON "antrian_stock_jahit"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_stock_jahit_id_transaksi_idx" ON "antrian_stock_jahit"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_stock_jahit_unique" ON "antrian_stock_jahit"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_jahit_id_spk_idx" ON "antrian_jahit"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_jahit_id_transaksi_idx" ON "antrian_jahit"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_jahit_unique" ON "antrian_jahit"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_finishing_id_spk_idx" ON "antrian_finishing"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_finishing_id_transaksi_idx" ON "antrian_finishing"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_finishing_unique" ON "antrian_finishing"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_foto_produk_id_spk_idx" ON "antrian_foto_produk"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_foto_produk_id_transaksi_idx" ON "antrian_foto_produk"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_foto_produk_unique" ON "antrian_foto_produk"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_stock_no_transaksi_id_spk_idx" ON "antrian_stock_no_transaksi"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_stock_no_transaksi_id_transaksi_idx" ON "antrian_stock_no_transaksi"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_stock_no_transaksi_unique" ON "antrian_stock_no_transaksi"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_pelunasan_id_spk_idx" ON "antrian_pelunasan"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_pelunasan_id_transaksi_idx" ON "antrian_pelunasan"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_pelunasan_unique" ON "antrian_pelunasan"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "antrian_pengiriman_id_spk_idx" ON "antrian_pengiriman"("id_spk");

-- CreateIndex
CREATE INDEX "antrian_pengiriman_id_transaksi_idx" ON "antrian_pengiriman"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_pengiriman_unique" ON "antrian_pengiriman"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE INDEX "database_produk_id_spk_idx" ON "database_produk"("id_spk");

-- CreateIndex
CREATE INDEX "database_produk_nama_desain_idx" ON "database_produk"("nama_desain");

-- CreateIndex
CREATE UNIQUE INDEX "database_produk_spk_nama_unique" ON "database_produk"("id_spk", "nama_desain");

-- CreateIndex
CREATE INDEX "database_sebaran_kecamatan_kabupaten_provinsi_idx" ON "database_sebaran"("kecamatan", "kabupaten", "provinsi");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_pengerjaan_desain_pra_produksi_unique" ON "antrian_pengerjaan_desain_pra_produksi"("id_rekap_custom", "id_custom");

-- CreateIndex
CREATE UNIQUE INDEX "antrian_revisi_pra_produksi_unique" ON "antrian_revisi_pra_produksi"("id_rekap_custom", "id_custom");
