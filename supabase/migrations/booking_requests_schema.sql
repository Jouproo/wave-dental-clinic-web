-- ============================================================
-- Wave Dental Clinic — Booking requests schema
-- Run this once in Supabase → SQL Editor.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- updated_at helper (idempotent; may already exist from blog_schema.sql)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- booking_requests ----------
-- Covers two patient-facing flows via request_type:
--  - 'appointment': the general online booking form (/book)
--  - 'implant_diagnosis': the free online implant diagnosis request
--    (/implant-diagnosis) — a doctor later fills diagnosis_notes here.
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('appointment', 'implant_diagnosis')),
  name text not null,
  phone text not null,
  age int,
  service_id text references services(id) on delete set null,
  preferred_date date,
  preferred_time text,
  message text,
  xray_paths text[] not null default '{}',
  consent_given boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'in_review', 'diagnosed', 'completed', 'cancelled')),
  diagnosis_notes text,
  diagnosed_by uuid references doctors(id) on delete set null,
  diagnosed_at timestamptz,
  submitter_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_booking_requests_updated_at on booking_requests;
create trigger trg_booking_requests_updated_at
  before update on booking_requests
  for each row execute function set_updated_at();

create index if not exists idx_booking_requests_type_status on booking_requests (request_type, status);
create index if not exists idx_booking_requests_created on booking_requests (created_at desc);
create index if not exists idx_booking_requests_ip_throttle on booking_requests (submitter_ip, created_at);

-- ============================================================
-- Row Level Security.
-- Unlike public content tables (doctors/services/blog), this table holds
-- patient PII and medical data, so it gets ZERO policies — not even public
-- SELECT. The app only ever reads/writes this table via supabaseServer()
-- (service-role key, bypasses RLS); anon/authenticated are fully denied,
-- including read, which is a deliberate departure from the blog/doctors
-- pattern where public SELECT policies exist.
-- ============================================================
alter table booking_requests enable row level security;

-- ============================================================
-- Private storage bucket for patient X-ray / scan uploads.
-- public = false: objects are NOT servable via the public CDN URL pattern
-- used by clinic-assets. Only the service-role key (used exclusively
-- server-side) can read/write; the admin UI uses short-lived signed URLs.
-- file_size_limit / allowed_mime_types are a storage-level backstop in
-- addition to the app-level checks in the upload route.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-uploads',
  'patient-uploads',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- No storage.objects policies needed: the bucket is private and the app
-- only ever touches it via the service-role key, which bypasses RLS —
-- same reasoning as the table above.
