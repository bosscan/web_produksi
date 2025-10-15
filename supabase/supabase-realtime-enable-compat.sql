-- Kompatibel: aktifkan Supabase Realtime untuk SEMUA tabel public TANPA keyword "ALL"
-- Gunakan ini jika perintah "ALTER PUBLICATION ... ADD ALL TABLES IN SCHEMA" error di proyek Anda

DO $$
DECLARE
  r record;
BEGIN
  -- Pastikan publication ada
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;

  -- Tambahkan setiap tabel public ke publication (abaikan jika sudah terdaftar)
  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = r.schemaname AND tablename = r.tablename
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I;', r.schemaname, r.tablename);
    END IF;
  END LOOP;
END$$;

-- Verifikasi
-- SELECT pubname, schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
