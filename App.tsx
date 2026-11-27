import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { Country } from './src/data';
import { JobDetail } from './src/JobDetail';
import { JobList } from './src/JobList';
import { s } from './src/styles';

// Route lives in the URL hash on web (#/us/electrician) so links and the back button work.
type Route = { country: Country; slug: string | null };
const web = Platform.OS === 'web' && typeof window !== 'undefined';

function parse(hash: string): Route {
  const [c, slug] = hash.replace(/^#\/?/, '').split('/');
  const country = (['US', 'CA', 'AU'] as Country[]).find(x => x.toLowerCase() === (c ?? '').toLowerCase()) ?? 'US';
  return { country, slug: slug || null };
}
const toHash = (r: Route) => `#/${r.country.toLowerCase()}${r.slug ? `/${r.slug}` : ''}`;

export default function App() {
  const [route, setRoute] = useState<Route>(() => (web ? parse(window.location.hash) : { country: 'US', slug: null }));
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (!web) return;
    const onHash = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [route.slug]);

  const go = (r: Route) => {
    if (web) { if (window.location.hash !== toHash(r)) window.location.hash = toHash(r); else setRoute(r); }
    else setRoute(r);
  };
  const back = () => go({ ...route, slug: null });

  return (
    <ScrollView ref={scroll} style={s.page} contentContainerStyle={s.content}>
      {route.slug
        ? <JobDetail slug={route.slug} country={route.country} onBack={back} onUsGuide={() => go({ country: 'US', slug: route.slug })} />
        : <JobList country={route.country} onCountry={c => go({ country: c, slug: null })} onOpen={slug => go({ ...route, slug })} />}
      <StatusBar style="dark" />
    </ScrollView>
  );
}
