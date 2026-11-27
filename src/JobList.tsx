import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { CATEGORY_LABEL, COUNTRIES, Country, JobRow, countryMeta, loadJobs, money } from './data';
import { s } from './styles';

export function JobList({ country, onCountry, onOpen }: { country: Country; onCountry: (c: Country) => void; onOpen: (slug: string) => void }) {
  const [category, setCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null); setError(null); setCategory(null);
    loadJobs(country).then(r => { if (!cancelled) setRows(r); }, e => { if (!cancelled) setError(String(e.message ?? e)); });
    return () => { cancelled = true; };
  }, [country]);

  const meta = countryMeta(country);
  const categories = useMemo(() => [...new Set((rows ?? []).map(r => r.category))].sort(), [rows]);
  const shown = (rows ?? []).filter(r => !category || r.category === category);
  const sources = [...new Map((rows ?? []).map(r => [r.source.url, r])).values()];

  return (
    <View>
      <Text style={s.logo}>workfind</Text>
      <Text accessibilityRole="header" style={s.title}>Discover work worth learning.</Text>
      <Text style={s.subtitle}>Hands-on jobs that pay well without a degree, ranked by median hourly pay. Tap a job to see what it is, how to learn it, and which certificate to aim for.</Text>

      <View style={s.row}>
        {COUNTRIES.map(c => (
          <Pressable key={c.code} accessibilityRole="button" accessibilityState={{ selected: c.code === country }}
            onPress={() => onCountry(c.code)} style={[s.chip, c.code === country && s.chipOn]}>
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

      {meta.allJobsMedian ? <Text style={s.note}>All-jobs median in {meta.label}: {money(meta.symbol, meta.allJobsMedian)}/hour.</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!rows && !error ? <ActivityIndicator style={{ marginTop: 32 }} /> : null}

      {shown.map((r, i) => (
        <Pressable key={r.slug} accessibilityRole="link" accessibilityLabel={`${r.name}, ${money(meta.symbol, r.median)} an hour`}
          onPress={() => onOpen(r.slug)} style={({ pressed }) => [s.card, pressed && s.cardPressed]}>
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
            <Text style={s.range}>Middle half earns {money(meta.symbol, r.low)} – {money(meta.symbol, r.high)}/h</Text>
          ) : null}
          <Text style={s.more}>See the job, training and certificates ›</Text>
        </Pressable>
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
    </View>
  );
}
