-- ============================================================
-- Wave Dental Clinic — CRM archive + import v2
-- Run this once in Supabase → SQL Editor, AFTER crm_import_schema.sql.
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- Archive metadata. `archived_at` already exists on leads (phase A); this adds
-- who archived it and why, so the archive is an auditable, reversible state
-- instead of a silent hide.
alter table leads add column if not exists archived_by uuid references admin_users(id) on delete set null;
alter table leads add column if not exists archive_reason text;

-- The leads list is always filtered on archived_at (active vs archive view)
-- and commonly on an entry_date range.
create index if not exists idx_leads_archived_entry on leads (archived_at, entry_date desc);
create index if not exists idx_leads_entry_date on leads (entry_date desc);
create index if not exists idx_leads_source on leads (source);

-- Import v2 records the column mapping and options used, so an import can be
-- explained after the fact.
alter table import_batches add column if not exists sheet_name text;
alter table import_batches add column if not exists column_mapping jsonb;
alter table import_batches add column if not exists options jsonb;
