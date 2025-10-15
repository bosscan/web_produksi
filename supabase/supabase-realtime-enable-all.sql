-- Enable Supabase Realtime untuk SELURUH tabel di schema public
-- Jalankan di Supabase SQL Editor SETELAH skema utama dibuat

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;
  -- Tambahkan semua tabel eksisting di schema public
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD ALL TABLES IN SCHEMA public';
END$$;

-- Verifikasi
-- SELECT pubname, schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
