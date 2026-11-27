import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const db = url && key ? createClient(url, key) : null;
export const NOT_CONFIGURED = 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';

export type Country = 'US' | 'CA' | 'AU';
export const COUNTRIES: { code: Country; label: string; symbol: string; allJobsMedian: number | null }[] = [
  // All-occupation median hourly wage from the same source as the job figures (null when not loaded yet).
  { code: 'US', label: 'United States', symbol: 'US$', allJobsMedian: 24.51 },
  { code: 'CA', label: 'Canada', symbol: 'C$', allJobsMedian: null },
  { code: 'AU', label: 'Australia', symbol: 'A$', allJobsMedian: 47 },
];
export const countryMeta = (c: Country) => COUNTRIES.find(x => x.code === c)!;

export const CATEGORY_LABEL: Record<string, string> = {
  construction: 'Construction', energy: 'Energy & plants', transport: 'Transport',
  repair: 'Repair & maintenance', manufacturing: 'Manufacturing',
};

export const money = (symbol: string, n: number) => `${symbol}${Number(n).toFixed(2)}`;
// Whole-dollar prices with thousands separators, e.g. US$1,800.
export const price = (symbol: string, n: number) => `${symbol}${Math.round(Number(n)).toLocaleString('en-US')}`;

export type Source = { publisher: string; url: string; title?: string | null };
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);

export type JobRow = {
  slug: string; name: string; category: string;
  low: number | null; median: number; high: number | null; asOf: string; source: Source;
  customerHourly?: { low: number; high: number } | null;
};

export async function loadJobs(country: Country): Promise<JobRow[]> {
  if (!db) throw new Error(NOT_CONFIGURED);
  const { data, error } = await db.from('occupation_pay')
    .select('pay_low, pay_median, pay_high, as_of, occupations(slug, name, category), sources(publisher, url)')
    .eq('country_code', country).eq('pay_unit', 'hour').order('pay_median', { ascending: false });
  if (error) throw new Error(error.message);
  // Customer hourly rates (cost guides) where we have them; the list shows them next to the wage.
  const { data: rates } = await db.from('service_prices').select('price_low, price_high, occupations(slug)')
    .eq('country_code', country).eq('unit', 'hour');
  const rateBySlug = new Map(((rates ?? []) as any[]).flatMap(r => {
    const o = one<any>(r.occupations);
    return o && r.price_low != null && r.price_high != null ? [[o.slug, { low: Number(r.price_low), high: Number(r.price_high) }] as const] : [];
  }));
  return (data ?? []).flatMap((r: any) => {
    const o = one<any>(r.occupations); const s = one<any>(r.sources);
    if (!o || !s) return [];
    return [{ slug: o.slug, name: o.name?.en ?? o.slug, category: o.category, low: r.pay_low, median: Number(r.pay_median),
      high: r.pay_high, asOf: r.as_of, source: { publisher: s.publisher, url: s.url }, customerHourly: rateBySlug.get(o.slug) ?? null }];
  });
}

export type PathStep = { label: string; pct: number };
export type Credential = {
  name: string; kind: string; issuer: string | null; mandatory: boolean; note: string | null;
  infoUrl: string | null; asOf: string | null; source: Source | null;
};
export type JobDetail = {
  id: string; slug: string; name: string; category: string;
  pay: JobRow | null;
  code: string | null; // country occupation code, e.g. SOC 47-2111
  profile: null | {
    description: string; tasks: string[]; studyTopics: string[]; externalCode: string | null;
    path: { job_zone?: number; education?: PathStep; experience?: PathStep; onsite_training?: PathStep; on_the_job?: PathStep };
    asOf: string; source: Source;
  };
  credentials: Credential[];
  prices: { item: string; unit: 'hour' | 'job' | 'visit'; low: number | null; high: number | null; typical: number | null; source: Source; asOf: string }[];
  selfEmployed: null | { pct: number; source: Source; asOf: string };
  apprenticeship: null | { approvedTitles: number; exampleTitles: string[]; typicalHours: number | null; asOf: string; source: Source };
};

export async function loadJob(slug: string, country: Country): Promise<JobDetail | null> {
  if (!db) throw new Error(NOT_CONFIGURED);
  const { data: occ, error } = await db.from('occupations').select('id, slug, name, category').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!occ) return null;
  const [pay, code, prof, req, ap, sp, mk] = await Promise.all([
    db.from('occupation_pay').select('pay_low, pay_median, pay_high, as_of, sources(publisher, url)')
      .eq('occupation_id', occ.id).eq('country_code', country).eq('pay_unit', 'hour').is('region_id', null).maybeSingle(),
    db.from('occupation_codes').select('system, code').eq('occupation_id', occ.id).eq('country_code', country).maybeSingle(),
    db.from('occupation_profiles').select('description, tasks, study_topics, typical_path, external_code, as_of, sources(publisher, url, title)')
      .eq('occupation_id', occ.id).eq('country_code', country).maybeSingle(),
    db.from('occupation_requirements').select('kind, mandatory, detail, as_of, credentials(name, kind, issuer, info_url, as_of, sources(publisher, url, title))')
      .eq('occupation_id', occ.id).eq('country_code', country).eq('kind', 'credential'),
    db.from('occupation_requirements').select('detail, as_of, sources(publisher, url, title)')
      .eq('occupation_id', occ.id).eq('country_code', country).eq('kind', 'experience')
      .eq('detail->>type', 'registered_apprenticeship').limit(1).maybeSingle(),
    db.from('service_prices').select('item, unit, price_low, price_high, price_typical, as_of, sources(publisher, url, title)')
      .eq('occupation_id', occ.id).eq('country_code', country).order('sort'),
    db.from('occupation_market').select('self_employed_pct, as_of, sources(publisher, url, title)')
      .eq('occupation_id', occ.id).eq('country_code', country).maybeSingle(),
  ]);
  for (const r of [pay, code, prof, req, ap, sp, mk]) if (r.error) throw new Error(r.error.message);
  const m: any = mk.data;
  const p: any = pay.data; const pr: any = prof.data; const a: any = ap.data;
  const name = (occ.name as any)?.en ?? occ.slug;
  return {
    id: occ.id, slug: occ.slug, name, category: occ.category,
    code: (code.data as any)?.code ?? null,
    pay: p ? { slug: occ.slug, name, category: occ.category, low: p.pay_low, median: Number(p.pay_median), high: p.pay_high,
      asOf: p.as_of, source: one<any>(p.sources) } : null,
    profile: pr ? {
      description: pr.description?.en ?? '', tasks: pr.tasks ?? [], studyTopics: pr.study_topics ?? [],
      externalCode: pr.external_code, path: pr.typical_path ?? {}, asOf: pr.as_of, source: one<any>(pr.sources),
    } : null,
    credentials: ((req.data ?? []) as any[]).flatMap(r => {
      const c = one<any>(r.credentials);
      if (!c) return [];
      return [{ name: c.name?.en ?? '', kind: c.kind, issuer: c.issuer, mandatory: r.mandatory, note: r.detail?.note_en ?? null,
        infoUrl: c.info_url, asOf: c.as_of, source: one<any>(c.sources) }];
    }).sort((x, y) => Number(y.mandatory) - Number(x.mandatory)),
    prices: ((sp.data ?? []) as any[]).map(r => ({ item: r.item?.en ?? '', unit: r.unit, low: r.price_low == null ? null : Number(r.price_low),
      high: r.price_high == null ? null : Number(r.price_high), typical: r.price_typical == null ? null : Number(r.price_typical),
      source: one<any>(r.sources), asOf: r.as_of })),
    selfEmployed: m && m.self_employed_pct != null ? { pct: Number(m.self_employed_pct), source: one<any>(m.sources), asOf: m.as_of } : null,
    apprenticeship: a ? {
      approvedTitles: a.detail?.approved_titles ?? 0, exampleTitles: a.detail?.example_titles ?? [],
      typicalHours: a.detail?.typical_hours ?? null, asOf: a.as_of, source: one<any>(a.sources),
    } : null,
  };
}

// Counts demand for a future Workfind course. No personal data is sent.
export async function registerInterest(occupationId: string, country: Country) {
  if (!db) throw new Error(NOT_CONFIGURED);
  const { error } = await db.from('learn_interest').insert({ occupation_id: occupationId, country_code: country, format: 'either' });
  if (error) throw new Error(error.message);
}
