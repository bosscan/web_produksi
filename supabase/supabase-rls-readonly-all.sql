-- Mengaktifkan RLS dan membuat policy READ-ONLY (SELECT) untuk semua tabel public
-- Jalankan ini jika frontend (anon key) butuh baca langsung tabel domain

DO $$
DECLARE
  r record;
  pol text;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  ) LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);

    -- Buat policy SELECT kalau belum ada
    pol := r.tablename || '_allow_select';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = r.schemaname AND p.tablename = r.tablename AND p.policyname = pol
    ) THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR SELECT USING (true);', pol, r.schemaname, r.tablename);
    END IF;
  END LOOP;
END$$;

-- Catatan: kebijakan ini READ-ONLY (hanya SELECT). Insert/Update/Delete akan ditolak untuk anon.
-- Untuk memperketat, ganti USING (true) dengan ekspresi berbasis auth.uid() atau kolom owner sesuai desain.
