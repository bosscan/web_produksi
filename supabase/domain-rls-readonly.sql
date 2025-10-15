-- RLS read-only untuk akses dari anon (client) ke tabel domain tertentu
-- Jalankan setelah skema dibuat. Saring tabel sesuai kebutuhan UI.

DO $$
DECLARE
  t text;
  pol_read text;
BEGIN
  -- Daftar tabel domain yang boleh di-SELECT dari client
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN (
    'antrian_input_desain',
    'keranjang'
    -- tambahkan tabel lain di sini sesuai kebutuhan
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    pol_read := t || '_allow_read_anon';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=t AND p.policyname=pol_read
    ) THEN
      EXECUTE format('CREATE POLICY "%I" ON public.%I FOR SELECT USING (true);', pol_read, t);
    END IF;
  END LOOP;
END$$;
