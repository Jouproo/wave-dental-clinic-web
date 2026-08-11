-- ============================================================
-- Wave Dental Clinic — Blog schema
-- Run this once in Supabase → SQL Editor.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ---------- updated_at helper ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- blog_categories ----------
create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_blog_categories_updated_at on blog_categories;
create trigger trg_blog_categories_updated_at
  before update on blog_categories
  for each row execute function set_updated_at();

-- ---------- blog_authors ----------
create table if not exists blog_authors (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  role text,
  specialty text,
  credentials text,
  bio text,
  image_url text,
  image_alt text,
  profile_url text,
  linked_doctor_id uuid references doctors(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_blog_authors_updated_at on blog_authors;
create trigger trg_blog_authors_updated_at
  before update on blog_authors
  for each row execute function set_updated_at();

-- ---------- blog_posts ----------
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body_json jsonb,
  body_html text,
  cover_image_url text,
  cover_image_alt text,
  category_id uuid references blog_categories(id) on delete set null,
  author_id uuid references blog_authors(id) on delete set null,
  reviewer_id uuid references blog_authors(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'scheduled', 'published', 'archived')),
  featured boolean not null default false,
  related_service_id text references services(id) on delete set null,
  tags text[] not null default '{}',
  seo_title text,
  meta_description text,
  canonical_override text,
  og_image_url text,
  focus_keyword text,
  medical_disclaimer text,
  published_at timestamptz,
  scheduled_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null
);

drop trigger if exists trg_blog_posts_updated_at on blog_posts;
create trigger trg_blog_posts_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

create index if not exists idx_blog_posts_status_published on blog_posts (status, published_at desc);
create index if not exists idx_blog_posts_category on blog_posts (category_id);
create index if not exists idx_blog_posts_author on blog_posts (author_id);
create index if not exists idx_blog_posts_scheduled on blog_posts (status, scheduled_at) where status = 'scheduled';

-- ---------- blog_post_sources ----------
create table if not exists blog_post_sources (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  title text not null,
  url text not null,
  sort_order int not null default 0
);
create index if not exists idx_blog_post_sources_post on blog_post_sources (post_id);

-- ---------- blog_post_faqs ----------
create table if not exists blog_post_faqs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 0
);
create index if not exists idx_blog_post_faqs_post on blog_post_faqs (post_id);

-- ---------- blog_post_related (manually curated, self-referencing m2m) ----------
create table if not exists blog_post_related (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  related_post_id uuid not null references blog_posts(id) on delete cascade,
  sort_order int not null default 0,
  constraint blog_post_related_no_self check (post_id <> related_post_id),
  constraint blog_post_related_unique unique (post_id, related_post_id)
);
create index if not exists idx_blog_post_related_post on blog_post_related (post_id);

-- ============================================================
-- Row Level Security — defense-in-depth safety net.
-- The app talks to Supabase only via the server-side service-role key
-- (which always bypasses RLS), so these policies don't change today's
-- behavior; they only guard against a future direct/anon client read.
-- ============================================================

alter table blog_categories enable row level security;
alter table blog_authors enable row level security;
alter table blog_posts enable row level security;
alter table blog_post_sources enable row level security;
alter table blog_post_faqs enable row level security;
alter table blog_post_related enable row level security;

drop policy if exists "public read active categories" on blog_categories;
create policy "public read active categories" on blog_categories
  for select using (status = 'active');

drop policy if exists "public read active authors" on blog_authors;
create policy "public read active authors" on blog_authors
  for select using (status = 'active');

drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts
  for select using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "public read sources of published posts" on blog_post_sources;
create policy "public read sources of published posts" on blog_post_sources
  for select using (
    exists (
      select 1 from blog_posts p
      where p.id = post_id and p.status = 'published' and p.published_at <= now()
    )
  );

drop policy if exists "public read faqs of published posts" on blog_post_faqs;
create policy "public read faqs of published posts" on blog_post_faqs
  for select using (
    exists (
      select 1 from blog_posts p
      where p.id = post_id and p.status = 'published' and p.published_at <= now()
    )
  );

drop policy if exists "public read related of published posts" on blog_post_related;
create policy "public read related of published posts" on blog_post_related
  for select using (
    exists (
      select 1 from blog_posts p
      where p.id = post_id and p.status = 'published' and p.published_at <= now()
    )
  );

-- No insert/update/delete policies are defined for anon/authenticated —
-- RLS denies by default, so only the service-role key (used exclusively
-- server-side in this app) can write.
