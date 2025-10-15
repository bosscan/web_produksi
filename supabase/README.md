# Setup Ulang Supabase + Vercel

Dokumen ini menuntun Anda men-setup proyek baru dari nol:

1) Buat Project Supabase baru
- Catat `Project URL`, `anon key`, dan `service_role key`.
- Buka SQL Editor.

2) Buat skema database dari Prisma (DDL)
- Jalankan file `supabase-init.sql` (hasil dari prisma migrate diff). File ini membuat seluruh tabel/enum/index/foreign key.

3) Aktifkan Realtime untuk semua tabel (publikasi Postgres)
- Opsi A (langsung semua tabel — jika DB mendukung keyword ALL): jalankan `supabase-realtime-enable-all.sql`.
- Opsi B (kompatibel): jalankan `supabase-realtime-enable-compat.sql` untuk menambahkan tabel satu per satu.
  - Keduanya memastikan publication `supabase_realtime` ada dan memuat semua tabel `public`.

4) (Pilih salah satu)
- Realtime langsung ke tabel domain: jalankan `supabase-rls-readonly-all.sql` agar anon client bisa SELECT (read-only) semua tabel public. Sesuaikan RLS untuk produksi.
- (Opsional) Mirror tabel sederhana untuk sinkronisasi JSON (tanpa FK)
- Jalankan `supabase-realtime-sync.sql` jika Anda ingin layer sync mirror `sync_*`. Jika tidak, Anda bisa langsung subscribe pada tabel domain.

5) Pasang env di Vercel
- `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`

6) Deploy frontend ke Vercel
- Pastikan `vercel.json` sudah mengarahkan semua route ke `index.html`.

Troubleshooting cepat:
- Cek publication: `SELECT pubname, schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';`
- Cek error policy/RLS: periksa pesan error saat `insert/select` dari Supabase.
