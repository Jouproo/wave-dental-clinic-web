-- ============================================================
-- Wave Dental Clinic — CRM Phase A schema
-- Run this once in Supabase → SQL Editor.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 1. admin_users — extend with RBAC fields.
-- The admin_users table itself may not exist yet on a fresh project (it's
-- created lazily from the "المسؤولون" admin page); guard every ALTER so
-- this migration doesn't fail if it's missing, and so it's safe to re-run
-- whether admin_users was created before or after this file runs.
-- ============================================================
do $$
begin
  if to_regclass('public.admin_users') is not null then
    alter table admin_users add column if not exists status text not null default 'active';
    alter table admin_users add column if not exists allowed_branch_ids uuid[] not null default '{}';
    alter table admin_users add column if not exists extra_permissions text[] not null default '{}';
    alter table admin_users add column if not exists manager_id uuid references admin_users(id) on delete set null;
    alter table admin_users add column if not exists scope_override text;

    if not exists (
      select 1 from pg_constraint where conname = 'admin_users_role_check'
    ) then
      alter table admin_users add constraint admin_users_role_check
        check (role in ('admin', 'sales_manager', 'sales_agent'));
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'admin_users_status_check'
    ) then
      alter table admin_users add constraint admin_users_status_check
        check (status in ('active', 'disabled'));
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'admin_users_scope_override_check'
    ) then
      alter table admin_users add constraint admin_users_scope_override_check
        check (scope_override in ('own', 'team', 'all') or scope_override is null);
    end if;
  end if;
end $$;

-- ============================================================
-- 2. branches
-- ============================================================
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_active boolean not null default true,
  bookable boolean not null default true,
  created_at timestamptz not null default now()
);

insert into branches (name, slug, is_active, bookable)
values ('6 أكتوبر', '6-october', true, true)
on conflict (slug) do nothing;

insert into branches (name, slug, is_active, bookable)
values ('شبرا', 'shubra', false, false)
on conflict (slug) do nothing;

-- ============================================================
-- 3. leads — the core CRM entity.
-- ============================================================
create sequence if not exists leads_code_seq;

create or replace function set_lead_code()
returns trigger as $$
begin
  if new.lead_code is null then
    new.lead_code := 'L-' || lpad(nextval('leads_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  lead_code text unique not null,
  legacy_id text unique,

  entry_date date not null default current_date,
  imported_at timestamptz,

  name text not null,
  mobile_raw text,
  mobile_normalized text,
  whatsapp_raw text,
  whatsapp_normalized text,
  alt_phone text,

  source text,
  campaign_raw text,

  service_interest text
    check (service_interest in (
      'زراعة', 'تقويم', 'تركيبات/زيركون', 'تبييض', 'تنظيف',
      'حشو/عصب', 'كشف أطفال', 'نايت جارد', 'غير محدد'
    ) or service_interest is null),
  mapped_service_id text references services(id) on delete set null,

  case_size text
    check (case_size in ('سن واحد', 'أكتر من سن', 'عدد كبير / فك كامل') or case_size is null),
  start_timing text
    check (start_timing in ('في أقرب وقت', 'خلال أسبوعين', 'لاحقًا') or start_timing is null),

  branch_id uuid references branches(id) on delete set null,
  gender text,
  job_title text,

  asked_price boolean not null default false,
  opened_messenger boolean not null default false,
  conversation_summary text,

  lead_score int not null default 0,
  score_breakdown jsonb not null default '{}',
  classification text not null default 'Cold'
    check (classification in ('Hot', 'Warm', 'Cold')),
  qualification_status text not null default 'needs_phone'
    check (qualification_status in ('qualified', 'qualifies_by_call', 'needs_phone', 'invalid_phone')),

  stage text not null default 'new'
    check (stage in (
      'new', 'contacted', 'qualified', 'exam_booked', 'exam_attended',
      'plan_presented', 'treatment_started', 'completed',
      'no_answer', 'not_interested', 'unqualified', 'lost'
    )),

  assigned_to uuid references admin_users(id) on delete set null,
  contact_attempts int not null default 0,
  last_contact_at timestamptz,
  last_call_result text,
  next_follow_up_at timestamptz,
  next_exam_at timestamptz,

  expected_value_egp numeric(12, 2),
  loss_reason text
    check (loss_reason in (
      'السعر', 'المكان بعيد', 'راح عيادة تانية', 'مش وقته',
      'مش مقتنع', 'لم يرد نهائيًا', 'رقم خطأ', 'أخرى'
    ) or loss_reason is null),
  loss_reason_other text,
  notes text,

  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

drop trigger if exists trg_leads_code on leads;
create trigger trg_leads_code
  before insert on leads
  for each row execute function set_lead_code();

create index if not exists idx_leads_assigned_to on leads (assigned_to);
create index if not exists idx_leads_branch_id on leads (branch_id);
create index if not exists idx_leads_mobile_normalized on leads (mobile_normalized);
create index if not exists idx_leads_stage on leads (stage);
create index if not exists idx_leads_classification on leads (classification);
create index if not exists idx_leads_next_follow_up on leads (next_follow_up_at);
create index if not exists idx_leads_created_at on leads (created_at desc);

-- ============================================================
-- 4. lead_stage_history
-- ============================================================
create table if not exists lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid references admin_users(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text
);

create index if not exists idx_lead_stage_history_lead on lead_stage_history (lead_id, changed_at desc);

-- ============================================================
-- 5. crm_settings — singleton (scoring weights, thresholds).
-- ============================================================
create table if not exists crm_settings (
  id int primary key default 1,
  scoring_weights jsonb not null default '{}',
  classification_thresholds jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null,
  constraint crm_settings_singleton check (id = 1)
);

insert into crm_settings (id, scoring_weights, classification_thresholds)
values (
  1,
  '{
    "case_size": {"سن واحد": 10, "أكتر من سن": 20, "عدد كبير / فك كامل": 30},
    "start_timing": {"في أقرب وقت": 30, "خلال أسبوعين": 20, "لاحقًا": 5},
    "asked_price": 25,
    "opened_messenger": 5,
    "valid_phone": 10
  }'::jsonb,
  '{"hot_min": 70, "warm_min": 45}'::jsonb
)
on conflict (id) do nothing;

drop trigger if exists trg_crm_settings_updated_at on crm_settings;
create trigger trg_crm_settings_updated_at
  before update on crm_settings
  for each row execute function set_updated_at();

-- ============================================================
-- 6. audit_logs — generic audit trail.
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_created on audit_logs (created_at desc);

-- ============================================================
-- Row Level Security — same posture as booking_requests: these tables hold
-- staff-internal/patient-adjacent data, so zero public policies. The app
-- only ever reads/writes via supabaseServer() (service-role key, bypasses
-- RLS); anon/authenticated are fully denied.
-- ============================================================
alter table branches enable row level security;
alter table leads enable row level security;
alter table lead_stage_history enable row level security;
alter table crm_settings enable row level security;
alter table audit_logs enable row level security;
