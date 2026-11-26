-- Workfind stage 1: hands-on job discovery (global from day one).
-- Applied 2026-11-26 to Supabase project rnsbkujcknlilkbntnck ("fundscan", shared with that app by owner choice) as migration workfind_stage1_discovery.
-- Rule: every number or eligibility claim shown to users must cite a source and an as-of date.

-- Reference data -------------------------------------------------------------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  publisher text not null,
  title text,
  license text,
  retrieved_at date not null,
  created_at timestamptz not null default now()
);

create table public.countries (
  code char(2) primary key check (code = upper(code)),        -- ISO 3166-1 alpha-2
  name jsonb not null check (jsonb_typeof(name) = 'object'),  -- {"en":"Korea","ko":"한국"}
  currency char(3) not null,                                  -- ISO 4217
  data_status text not null default 'planned' check (data_status in ('planned','partial','live'))
);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.countries(code),
  parent_id uuid references public.regions(id),
  level text not null check (level in ('admin1','admin2','metro')),
  code text,                                                  -- official code if any (e.g. US state FIPS)
  name jsonb not null check (jsonb_typeof(name) = 'object'),
  unique (country_code, level, code)
);

create table public.occupations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name jsonb not null check (jsonb_typeof(name) = 'object'),
  summary jsonb not null default '{}' check (jsonb_typeof(summary) = 'object'),
  category text not null,                                     -- e.g. construction, beauty, craft, repair
  hands_on boolean not null default true,
  physical_demand text check (physical_demand in ('low','medium','high')),
  hazards text[] not null default '{}',
  isco_code text,                                             -- cross-country mapping (ISCO-08)
  created_at timestamptz not null default now()
);

-- Country-specific codes (SOC for US, NOC for CA, ANZSCO for AU, KECO for KR)
create table public.occupation_codes (
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  system text not null,
  code text not null,
  primary key (occupation_id, country_code, system)
);

create table public.occupation_pay (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  region_id uuid references public.regions(id),               -- null = national figure
  currency char(3) not null,
  pay_unit text not null check (pay_unit in ('hour','day','month','year')),
  pay_low numeric check (pay_low >= 0),
  pay_median numeric check (pay_median >= 0),
  pay_high numeric check (pay_high >= 0),
  sample_size integer check (sample_size >= 0),
  as_of date not null,
  source_id uuid not null references public.sources(id),
  check (pay_low is null or pay_high is null or pay_low <= pay_high)
);
create index occupation_pay_lookup on public.occupation_pay(occupation_id, country_code, region_id);

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.countries(code),
  name jsonb not null check (jsonb_typeof(name) = 'object'),
  kind text not null check (kind in ('license','certificate','apprenticeship','registration')),
  issuer text,
  typical_weeks integer check (typical_weeks >= 0),
  cost_low numeric check (cost_low >= 0),
  cost_high numeric check (cost_high >= 0),
  currency char(3),
  info_url text,
  source_id uuid references public.sources(id),
  as_of date
);

create table public.occupation_requirements (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  region_id uuid references public.regions(id),               -- some licenses are state/province-level
  kind text not null check (kind in ('credential','education','experience','language','age','physical','other')),
  credential_id uuid references public.credentials(id),
  mandatory boolean not null,
  detail jsonb not null default '{}' check (jsonb_typeof(detail) = 'object'),
  source_id uuid references public.sources(id),
  as_of date,
  check (kind <> 'credential' or credential_id is not null)
);

-- Foreign-worker eligibility. Default is 'unknown'; never show 'eligible' without a source.
create table public.work_eligibility (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  visa_type text not null,                                    -- e.g. 'E-9', 'E-7-3', 'H-2B', 'TSS-482'
  status text not null default 'unknown' check (status in ('eligible','conditional','not_eligible','unknown')),
  conditions jsonb not null default '{}' check (jsonb_typeof(conditions) = 'object'),
  source_id uuid references public.sources(id),
  as_of date,
  check (status in ('unknown') or (source_id is not null and as_of is not null)),
  unique (occupation_id, country_code, visa_type)
);

-- User data -----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  country_code char(2) references public.countries(code),
  region_id uuid references public.regions(id),
  nationality char(2),
  visa_type text,                                             -- null = citizen/permanent resident or not given
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  prep_budget numeric,
  prep_weeks integer,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_occupations (
  user_id uuid not null references auth.users(id) on delete cascade,
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, occupation_id)
);

-- "I want to learn this" signal: demand data for stage 2 courses. Anonymous allowed via server.
create table public.learn_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) references public.countries(code),
  region_id uuid references public.regions(id),
  format text check (format in ('online','in_person','either')),
  created_at timestamptz not null default now()
);

-- Countries without data yet: "notify me when ready".
create table public.country_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  country_code char(2) not null,
  created_at timestamptz not null default now(),
  unique (email, country_code)
);

-- Entry barrier summary (strictest mandatory requirements per occupation/country).
create view public.entry_barrier with (security_invoker = true) as
select r.occupation_id, r.country_code,
  count(*) filter (where r.mandatory and r.kind = 'credential') as mandatory_credentials,
  coalesce(sum(c.typical_weeks) filter (where r.mandatory), 0) as mandatory_weeks,
  coalesce(sum(c.cost_high) filter (where r.mandatory), 0) as mandatory_cost_high
from public.occupation_requirements r
left join public.credentials c on c.id = r.credential_id
group by r.occupation_id, r.country_code;

-- Security ------------------------------------------------------------------
alter table public.sources enable row level security;
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.occupations enable row level security;
alter table public.occupation_codes enable row level security;
alter table public.occupation_pay enable row level security;
alter table public.credentials enable row level security;
alter table public.occupation_requirements enable row level security;
alter table public.work_eligibility enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_occupations enable row level security;
alter table public.learn_interest enable row level security;
alter table public.country_waitlist enable row level security;

-- Reference data: public read, writes only via service role (no write policies).
create policy "public read" on public.sources for select to anon, authenticated using (true);
create policy "public read" on public.countries for select to anon, authenticated using (true);
create policy "public read" on public.regions for select to anon, authenticated using (true);
create policy "public read" on public.occupations for select to anon, authenticated using (true);
create policy "public read" on public.occupation_codes for select to anon, authenticated using (true);
create policy "public read" on public.occupation_pay for select to anon, authenticated using (true);
create policy "public read" on public.credentials for select to anon, authenticated using (true);
create policy "public read" on public.occupation_requirements for select to anon, authenticated using (true);
create policy "public read" on public.work_eligibility for select to anon, authenticated using (true);

-- Owner-only user data.
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own saved" on public.saved_occupations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own interest insert" on public.learn_interest for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own interest read" on public.learn_interest for select to authenticated
  using ((select auth.uid()) = user_id);
-- country_waitlist: no client policies; the server inserts with the service role.

-- Seed countries (data_status stays 'planned' until sourced rows exist).
insert into public.countries(code, name, currency) values
  ('US', '{"en":"United States","ko":"미국"}', 'USD'),
  ('KR', '{"en":"South Korea","ko":"한국"}', 'KRW'),
  ('CA', '{"en":"Canada","ko":"캐나다"}', 'CAD'),
  ('AU', '{"en":"Australia","ko":"호주"}', 'AUD');
