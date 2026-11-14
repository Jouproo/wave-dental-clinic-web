-- ============================================================
-- Wave Dental Clinic — CRM settings v2 (editable from /admin/crm/settings)
-- Run this once in Supabase → SQL Editor, AFTER crm_schema_phase_a.sql.
-- Safe to re-run.
--
-- `config` holds what the CRM settings page edits: stage labels/colors,
-- the source list, archive reasons, time zone and the "stale lead" age.
-- The app falls back to built-in defaults while this column is missing,
-- so the CRM keeps working before this file is run (only saving is blocked).
-- ============================================================
alter table crm_settings add column if not exists config jsonb not null default '{}';

-- Reports read stage history by date range.
create index if not exists idx_lead_stage_history_changed_at on lead_stage_history (changed_at desc);
