-- Mirror tables for realtime sync (simple JSON payload store)
-- Run these in Supabase SQL Editor to enable realtime-friendly storage

create table if not exists public.sync_antrian_input_desain (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_design_queue (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_keranjang (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_plotting_rekap_bordir_queue (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_spk_pipeline (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_method_rekap_bordir (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_spk_orders (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_database_produk (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_database_konsumen (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_database_trend (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_database_sebaran (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_omset_pendapatan (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_pelunasan_transaksi (
  unique_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Attach triggers
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename like 'sync_%' LOOP
    EXECUTE format('drop trigger if exists set_updated_at_%I on public.%I;', t, t);
    EXECUTE format('create trigger set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at();', t, t);
  END LOOP;
END$$;

-- Ensure Realtime publication exists and includes all sync_* tables
DO $$
DECLARE
  t text;
BEGIN
  -- Create publication if missing
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;

  -- Add each sync_* table to the publication if not already present
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'sync_%' LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END$$;

-- Enable Realtime for these tables (Supabase Realtime listens to WAL on all public tables when enabled)
-- In Dashboard: Database -> Replication -> Configure -> add each sync_* table
-- Or via SQL if extension available (commented as this depends on managed settings)
-- select realtime.add_publication('supabase_realtime', array['public.sync_antrian_input_desain', 'public.sync_design_queue', 'public.sync_keranjang', 'public.sync_plotting_rekap_bordir_queue', 'public.sync_spk_pipeline', 'public.sync_method_rekap_bordir', 'public.sync_spk_orders', 'public.sync_database_produk', 'public.sync_database_konsumen', 'public.sync_database_trend', 'public.sync_database_sebaran', 'public.sync_omset_pendapatan', 'public.sync_pelunasan_transaksi']);

-- RLS and policies for anon reads/writes (adjust as needed)
alter table public.sync_antrian_input_desain enable row level security;
alter table public.sync_design_queue enable row level security;
alter table public.sync_keranjang enable row level security;
alter table public.sync_plotting_rekap_bordir_queue enable row level security;
alter table public.sync_spk_pipeline enable row level security;
alter table public.sync_method_rekap_bordir enable row level security;
alter table public.sync_spk_orders enable row level security;
alter table public.sync_database_produk enable row level security;
alter table public.sync_database_konsumen enable row level security;
alter table public.sync_database_trend enable row level security;
alter table public.sync_database_sebaran enable row level security;
alter table public.sync_omset_pendapatan enable row level security;
alter table public.sync_pelunasan_transaksi enable row level security;

-- Create basic read/write/upsert policies for all sync_* tables (idempotent)
DO $$
DECLARE
  t text;
  pol_read text;
  pol_write text;
  pol_upsert text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename like 'sync_%' LOOP
    pol_read := t || '_allow_read';
    pol_write := t || '_allow_write';
    pol_upsert := t || '_allow_upsert';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t AND p.policyname = pol_read
    ) THEN
      EXECUTE format('create policy "%I" on public.%I for select using (true);', pol_read, t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t AND p.policyname = pol_write
    ) THEN
      EXECUTE format('create policy "%I" on public.%I for insert with check (true);', pol_write, t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t AND p.policyname = pol_upsert
    ) THEN
      EXECUTE format('create policy "%I" on public.%I for update using (true);', pol_upsert, t);
    END IF;
  END LOOP;
END$$;
