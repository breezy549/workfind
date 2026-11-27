-- What customers pay for common jobs in a trade (cost-guide ranges), and how many workers are self-employed.
create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  item jsonb not null check (jsonb_typeof(item) = 'object'),
  unit text not null check (unit in ('hour','job','visit')),
  currency char(3) not null,
  price_low numeric check (price_low >= 0),
  price_high numeric check (price_high >= 0),
  price_typical numeric check (price_typical >= 0),
  sort smallint not null default 0,
  source_id uuid not null references public.sources(id),
  as_of date not null,
  check (price_low is null or price_high is null or price_low <= price_high)
);
create index service_prices_lookup on public.service_prices(occupation_id, country_code);
create table public.occupation_market (
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  country_code char(2) not null references public.countries(code),
  self_employed_pct numeric check (self_employed_pct between 0 and 100),
  source_id uuid not null references public.sources(id),
  as_of date not null,
  primary key (occupation_id, country_code)
);
alter table public.service_prices enable row level security;
alter table public.occupation_market enable row level security;
create policy "public read" on public.service_prices for select to anon, authenticated using (true);
create policy "public read" on public.occupation_market for select to anon, authenticated using (true);
