import { createClient } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db = url && key ? createClient(url, key) : null;

type Country = 'US' | 'CA' | 'AU';
const COUNTRIES: { code: Country; label: string; symbol: string; allJobsMedian: number | null }[] = [
  // All-occupation median hourly wage from the same source as the job figures (null when not loaded yet).
  { code: 'US', label: 'United States', symbol: 'US$', allJobsMedian: 24.51 },
  { code: 'CA', label: 'Canada', symbol: 'C$', allJobsMedian: null },
  { code: 'AU', label: 'Australia', symbol: 'A$', allJobsMedian: 47 },
];

type Row = {
  slug: string;
  name: string;
  category: string;
  low: number | null;
  median: number;
  high: number | null;
  asOf: string;
  source: { publisher: string; url: string };
};

const CATEGORY_LABEL: Record<string, string> = {
  construction: 'Construction', energy: 'Energy & plants', transport: 'Transport',
  repair: 'Repair & maintenance', manufacturing: 'Manufacturing',
};

const money = (symbol: string, n: number) => `${symbol}${n.toFixed(2)}`;

export default function App() {
  const [country, setCountry] = useState<Country>('US');
  const [category, setCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) { setError('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'); return; }
    let cancelled = false;
    setRows(null); setError(null);
    db.from('occupation_pay')
      .select('pay_low, pay_median, pay_high, as_of, occupations(slug, name, category), sources(publisher, url)')
      .eq('country_code', country)
      .eq('pay_unit', 'hour')
      .order('pay_median', { ascending: false })
      .then(({ data, error: e }) => {
        if (cancelled) return;
        if (e) { setError(e.message); return; }
        setRows((data ?? []).flatMap((r: any) => {
          const o = Array.isArray(r.occupations) ? r.occupations[0] : r.occupations;
          const s = Array.isArray(r.sources) ? r.sources[0] : r.sources;
          if (!o || !s) return [];
          return [{ slug: o.slug, name: o.name?.en ?? o.slug, category: o.category, low: r.pay_low, median: Number(r.pay_median),
            high: r.pay_high, asOf: r.as_of, source: { publisher: s.publisher, url: s.url } }];
        }));
      });
    return () => { cancelled = true; };
  }, [country]);

  const meta = COUNTRIES.find(c => c.code === country)!;
  const categories = useMemo(() => [...new Set((rows ?? []).map(r => r.category))].sort(), [rows]);
  const shown = (rows ?? []).filter(r => !category || r.category === category);
  const sources = [...new Map((rows ?? []).map(r => [r.source.url, r])).values()];

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.logo}>workfind</Text>
      <Text accessibilityRole="header" style={s.title}>Discover work worth learning.</Text>
      <Text style={s.subtitle}>Hands-on jobs that pay well without a degree, ranked by median hourly pay.</Text>

      <View style={s.row}>
        {COUNTRIES.map(c => (
          <Pressable key={c.code} accessibilityRole="button" accessibilityState={{ selected: c.code === country }}
            onPress={() => { setCountry(c.code); setCategory(null); }} style={[s.chip, c.code === country && s.chipOn]}>
            <Text style={[s.chipText, c.code === country && s.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {categories.length > 1 ? (
        <View style={s.row}>
          {[null, ...categories].map(cat => (
            <Pressable key={cat ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: cat === category }}
              onPress={() => setCategory(cat)} style={[s.smallChip, cat === category && s.chipOn]}>
              <Text style={[s.smallChipText, cat === category && s.chipTextOn]}>{cat ? CATEGORY_LABEL[cat] ?? cat : 'All'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {meta.allJobsMedian ? (
        <Text style={s.note}>All-jobs median in {meta.label}: {money(meta.symbol, meta.allJobsMedian)}/hour.</Text>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}
      {!rows && !error ? <ActivityIndicator style={{ marginTop: 32 }} /> : null}

      {shown.map((r, i) => (
        <View key={r.slug} style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.rank}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{r.name}</Text>
              <Text style={s.category}>{CATEGORY_LABEL[r.category] ?? r.category}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.pay}>{money(meta.symbol, r.median)}<Text style={s.unit}>/h</Text></Text>
              {meta.allJobsMedian ? <Text style={s.ratio}>{(r.median / meta.allJobsMedian).toFixed(1)}× all-jobs median</Text> : null}
            </View>
          </View>
          {r.low != null && r.high != null ? (
            <Text style={s.range}>Middle half earns {money(meta.symbol, Number(r.low))} – {money(meta.symbol, Number(r.high))}/h</Text>
          ) : null}
        </View>
      ))}

      {rows && shown.length === 0 && !error ? <Text style={s.note}>No jobs loaded for this country yet.</Text> : null}

      {sources.length ? (
        <View style={s.sources}>
          <Text style={s.sourcesTitle}>Sources</Text>
          {sources.map(r => (
            <Text key={r.source.url} style={s.sourceLink} onPress={() => Linking.openURL(r.source.url)}>
              {r.source.publisher} (data as of {r.asOf})
            </Text>
          ))}
          <Text style={s.disclaimer}>Typical pay for the occupation, not a promise of individual earnings.</Text>
        </View>
      ) : null}
      <StatusBar style="dark" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
  logo: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8, color: '#111' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#ccc' },
  chipOn: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 15, color: '#222' },
  chipTextOn: { color: '#fff' },
  smallChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: '#ddd' },
  smallChipText: { fontSize: 13, color: '#333' },
  note: { fontSize: 13, color: '#666', marginBottom: 12 },
  error: { color: '#b00020', marginVertical: 16 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 24, fontSize: 15, fontWeight: '700', color: '#999' },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  category: { fontSize: 13, color: '#777', marginTop: 2 },
  pay: { fontSize: 20, fontWeight: '800', color: '#111' },
  unit: { fontSize: 13, fontWeight: '400', color: '#666' },
  ratio: { fontSize: 12, color: '#2e7d32', marginTop: 2 },
  range: { fontSize: 13, color: '#555', marginTop: 8, marginLeft: 36 },
  sources: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  sourcesTitle: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 4 },
  sourceLink: { fontSize: 13, color: '#1a5fb4', marginBottom: 4 },
  disclaimer: { fontSize: 12, color: '#888', marginTop: 6 },
});
