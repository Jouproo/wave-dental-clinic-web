-- ============================================================
-- Wave Dental Clinic — CRM Excel import schema
-- Run this once in Supabase → SQL Editor, AFTER crm_schema_phase_a.sql.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  source_filename text not null,
  imported_by uuid references admin_users(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_rows int not null default 0,
  inserted_count int not null default 0,
  duplicate_count int not null default 0,
  review_count int not null default 0,
  error_count int not null default 0,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.leads') is not null then
    alter table leads add column if not exists import_batch_id uuid references import_batches(id) on delete set null;
    alter table leads add column if not exists needs_review boolean not null default false;
    alter table leads add column if not exists review_notes text;
  end if;
end $$;

create index if not exists idx_leads_import_batch on leads (import_batch_id);

alter table import_batches enable row level security;
