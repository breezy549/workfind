-- Workfind stage 1b: occupation profiles (what the job is, typical path in) and anonymous "I want to learn this".
create table public.occupation_profiles (
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  description jsonb not null default '{}' check (jsonb_typeof(description) = 'object'),  -- {"en": "..."}
  tasks jsonb not null default '[]' check (jsonb_typeof(tasks) = 'array'),              -- top core tasks by importance
  study_topics jsonb not null default '[]' check (jsonb_typeof(study_topics) = 'array'),-- top knowledge areas by importance
  typical_path jsonb not null default '{}' check (jsonb_typeof(typical_path) = 'object'),-- most common education / experience / training category with % of workers
  external_code text,                                                                    -- e.g. O*NET-SOC 47-2111.00
  source_id uuid not null references public.sources(id),
  as_of date not null,
  primary key (occupation_id, country_code)
);
alter table public.occupation_profiles enable row level security;
create policy "public read" on public.occupation_profiles for select to anon, authenticated using (true);

-- Let signed-out visitors register interest (no user id). Signed-in users keep the existing owner policy.
create policy "anon interest insert" on public.learn_interest for insert to anon
  with check (user_id is null);
