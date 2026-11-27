import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { CATEGORY_LABEL, Country, JobDetail as Job, countryMeta, loadJob, money, price, registerInterest } from './data';
import { usLinks } from './links';
import { s } from './styles';

const STEPS = ['What it is', 'How to learn it', 'Get certified'] as const;
type Step = 0 | 1 | 2;

function LinkRow({ title, detail, url }: { title: string; detail: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={({ pressed }) => [s.linkRow, pressed && s.cardPressed]}>
      <Text style={s.linkTitle}>{title} ↗</Text>
      <Text style={s.linkDetail}>{detail}</Text>
    </Pressable>
  );
}

export function JobDetail({ slug, country, onBack, onUsGuide }: { slug: string; country: Country; onBack: () => void; onUsGuide: () => void }) {
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [interest, setInterest] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    setJob(undefined); setError(null); setStep(0); setInterest('idle');
    loadJob(slug, country).then(j => { if (!cancelled) setJob(j); }, e => { if (!cancelled) setError(String(e.message ?? e)); });
    return () => { cancelled = true; };
  }, [slug, country]);

  const back = <Pressable accessibilityRole="link" onPress={onBack}><Text style={s.back}>‹ All jobs</Text></Pressable>;
  if (error) return <View>{back}<Text style={s.error}>{error}</Text></View>;
  if (job === undefined) return <View>{back}<ActivityIndicator style={{ marginTop: 32 }} /></View>;
  if (job === null) return <View>{back}<Text style={s.note}>We couldn't find that job.</Text></View>;

  const meta = countryMeta(country);
  const pr = job.profile;
  const links = country === 'US' && pr?.externalCode ? usLinks(pr.externalCode) : null;
  const appr = job.apprenticeship;
  const years = appr?.typicalHours ? Math.round((appr.typicalHours / 2000) * 2) / 2 : null; // registered programs count about 2,000 paid hours a year
  const path = pr?.path ?? {};
  const mandatory = job.credentials.filter(c => c.mandatory);
  const optional = job.credentials.filter(c => !c.mandatory);

  const sendInterest = () => {
    setInterest('sending');
    registerInterest(job.id, country).then(() => setInterest('done'), () => setInterest('failed'));
  };

  return (
    <View>
      {back}
      <Text style={s.category}>{CATEGORY_LABEL[job.category] ?? job.category}</Text>
      <Text accessibilityRole="header" style={s.jobTitle}>{job.name}</Text>
      {job.pay ? (
        <View style={s.payBox}>
          <Text style={s.payBig}>{money(meta.symbol, job.pay.median)}<Text style={s.unit}>/hour median</Text></Text>
          {meta.allJobsMedian ? <Text style={s.ratio}>{(job.pay.median / meta.allJobsMedian).toFixed(1)}× the all-jobs median in {meta.label}</Text> : null}
          {job.pay.low != null && job.pay.high != null ? <Text style={s.rangeFlat}>Middle half earns {money(meta.symbol, job.pay.low)} – {money(meta.symbol, job.pay.high)}/h</Text> : null}
        </View>
      ) : null}


      {job.prices.length ? (
        <View style={s.moneyBox}>
          <Text style={s.badge}>WHAT CUSTOMERS PAY</Text>
          {job.prices.map(x => (
            <View key={x.item} style={s.priceRow}>
              <Text style={s.priceItem}>{x.item}</Text>
              <Text style={s.priceVal}>
                {x.low != null && x.high != null ? `${price(meta.symbol, x.low)} – ${price(meta.symbol, x.high)}` : x.typical != null ? price(meta.symbol, x.typical) : ''}
                <Text style={s.unit}>{x.unit === 'hour' ? '/h' : x.unit === 'visit' ? ' per visit' : ' per job'}</Text>
              </Text>
            </View>
          ))}
          {job.pay ? (() => {
            // Compare a small, mostly-labor job only; big jobs include materials and days of work.
            const mid = (x: Job['prices'][number]) => x.typical ?? (x.low != null && x.high != null ? (x.low + x.high) / 2 : null);
            const ex = job.prices.find(x => x.unit === 'job' && (mid(x) ?? Infinity) <= 400);
            const exPrice = ex ? mid(ex) : null;
            return (
              <View style={{ marginTop: 10 }}>
                <Text style={s.bodySmall}>
                  An employee in this job earns a median of {money(meta.symbol, job.pay.median)}/h. The rest of what the customer pays goes to the business: travel, insurance, the van and tools, office staff, time that can't be billed, and profit.
                </Text>
                {ex && exPrice ? (
                  <Text style={s.highlight}>
                    One “{ex.item.toLowerCase()}” job at about {price(meta.symbol, exPrice)} equals {(exPrice / job.pay.median).toFixed(1)} hours of a typical employee’s pay.
                  </Text>
                ) : null}
              </View>
            );
          })() : null}
          {job.selfEmployed ? (
            <Text style={s.bodySmall}>
              <Text style={s.factKey}>Going independent: </Text>
              {job.selfEmployed.pct}% of people in this job are self-employed. With your own customers (and a license where your state requires one), you set the price, and the costs above become yours too.
            </Text>
          ) : null}
          <Text style={s.small}>Customer prices are national ranges from cost guides, not quotes. They vary a lot by city and job.</Text>
        </View>
      ) : null}

      {pr ? <View style={s.stepper} accessibilityRole="tablist">
        {STEPS.map((label, i) => (
          <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: step === i }} onPress={() => setStep(i as Step)}
            style={[s.stepTab, step === i && s.stepTabOn]}>
            <Text style={[s.stepNum, step === i && s.chipTextOn]}>{i + 1}</Text>
            <Text style={[s.stepLabel, step === i && s.chipTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View> : null}

      {!pr && country !== 'US' ? (
        <View style={s.interestBox}>
          <Text style={s.h3}>Training and certificate guide for {meta.label} is coming</Text>
          <Text style={s.small}>The pay above is official {meta.label} data. Rules for training and licenses differ by country, so we're checking them before we show them.</Text>
          <Pressable accessibilityRole="link" onPress={onUsGuide} style={[s.secondary, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#fff' }]}><Text style={s.secondaryText}>See how it works in the United States ›</Text></Pressable>
        </View>
      ) : null}

      {step === 0 && pr ? (
        <View>
          <Text style={s.body}>{pr.description}</Text>
          <Text style={s.h2}>A typical day</Text>
          {pr.tasks.map(t => <Text key={t} style={s.bullet}>•  {t}</Text>)}
          <Text style={s.h2}>Who gets in</Text>
          {path.education ? <Text style={s.fact}><Text style={s.factKey}>Most common schooling: </Text>{path.education.label} ({path.education.pct}% of workers)</Text> : null}
          {path.experience ? <Text style={s.fact}><Text style={s.factKey}>Prior experience: </Text>{path.experience.label} ({path.experience.pct}%)</Text> : null}
          {path.on_the_job ? <Text style={s.fact}><Text style={s.factKey}>Training on the job: </Text>{path.on_the_job.label} ({path.on_the_job.pct}%)</Text> : null}
          <Text style={s.small}>Survey of people working in this job. Percent = share of workers who gave the most common answer.</Text>
        </View>
      ) : null}

      {step === 1 && pr ? (
        <View>
          {appr ? (
            <View style={s.earnBox}>
              <Text style={s.badge}>EARN WHILE YOU LEARN</Text>
              <Text style={s.h3}>Paid apprenticeship{years ? `, about ${years} year${years === 1 ? '' : 's'}` : ''}</Text>
              <Text style={s.bodySmall}>
                You get hired as an apprentice, earn a wage from day one, and learn on the job with some classes.
                {appr.typicalHours ? ` Approved programs typically run ${appr.typicalHours.toLocaleString('en-US')} hours of paid on-the-job learning.` : ''}
              </Text>
              <Text style={s.small}>
                {appr.approvedTitles} U.S. Department of Labor approved apprenticeship{appr.approvedTitles === 1 ? '' : 's'} for this job, such as: {appr.exampleTitles.slice(0, 3).join(', ')}.
              </Text>
            </View>
          ) : (
            <Text style={s.body}>There's no registered apprenticeship for this job yet. Most people start with a short course or a trainee job and learn on the job.</Text>
          )}
          {path.education ? <Text style={s.small}>Most common schooling in this job: {path.education.label} ({path.education.pct}% of workers).</Text> : null}
          {links ? (
            <View style={{ marginTop: 8 }}>
              {appr ? <LinkRow title="Find an open apprenticeship" detail={`Apprenticeship.gov (U.S. Department of Labor). Search for "${appr.exampleTitles[0]}" and your city.`} url={links.apprenticeships} /> : null}
              <LinkRow title="Training programs" detail="Community colleges and trade schools for this job, with length and format (CareerOneStop, U.S. Department of Labor)." url={links.training} />
            </View>
          ) : null}
          <View style={s.interestBox}>
            <Text style={s.h3}>Want to learn this on Workfind?</Text>
            <Text style={s.small}>We're building short video courses taught by people who do this work. Tell us you're interested and we'll build the most wanted ones first. We don't ask for your name or email.</Text>
            <Pressable accessibilityRole="button" disabled={interest === 'sending' || interest === 'done'} onPress={sendInterest}
              style={[s.primary, interest === 'done' && s.primaryDone]}>
              <Text style={s.primaryText}>{interest === 'done' ? 'Counted, thank you' : interest === 'sending' ? 'Sending…' : 'I want to learn this'}</Text>
            </Pressable>
            {interest === 'failed' ? <Text style={s.error}>That didn't go through. Please try again.</Text> : null}
          </View>
        </View>
      ) : null}

      {step === 2 && pr ? (
        <View>
          {mandatory.length ? <Text style={s.h2}>Required to work</Text> : null}
          {mandatory.map(c => (
            <View key={c.name} style={s.credCard}>
              <Text style={s.credName}>{c.name}</Text>
              {c.issuer ? <Text style={s.small}>Who issues it: {c.issuer}</Text> : null}
              {c.note ? <Text style={s.bodySmall}>{c.note}</Text> : null}
              {c.infoUrl ? <Text style={s.sourceLink} onPress={() => Linking.openURL(c.infoUrl!)}>Official requirements ↗</Text> : null}
            </View>
          ))}
          {optional.length ? <Text style={s.h2}>{mandatory.length ? 'Also worth getting' : 'Certificates employers look for'}</Text> : null}
          {optional.map(c => (
            <View key={c.name} style={s.credCard}>
              <Text style={s.credName}>{c.name}</Text>
              {c.issuer ? <Text style={s.small}>Who issues it: {c.issuer}</Text> : null}
              {c.note ? <Text style={s.bodySmall}>{c.note}</Text> : null}
              {c.infoUrl ? <Text style={s.sourceLink} onPress={() => Linking.openURL(c.infoUrl!)}>Official details ↗</Text> : null}
            </View>
          ))}
          {!job.credentials.length ? <Text style={s.body}>There's no single national license for this job. Employers train and qualify you, and some states add their own rules. Check below.</Text> : null}

          <Text style={s.h2}>What to study</Text>
          <Text style={s.small}>The knowledge areas workers rate most important for this job.</Text>
          {pr.studyTopics.map((t, i) => <Text key={t} style={s.bullet}>{i + 1}.  {t}</Text>)}

          <Text style={s.h2}>Your prep plan</Text>
          <Text style={s.bullet}>1.  Check your state's rules for this job (license finder below).</Text>
          <Text style={s.bullet}>2.  {mandatory.length ? `Read the official requirements for ${mandatory[0].name}.` : 'Pick a certificate employers in your area ask for.'}</Text>
          <Text style={s.bullet}>3.  Get the hours or training the exam asks for, usually through an apprenticeship or trainee job.</Text>
          <Text style={s.bullet}>4.  Study the topics above, then book the exam.</Text>
          {links ? (
            <View style={{ marginTop: 8 }}>
              <LinkRow title="Licenses by state" detail="See whether your state requires a license for this job (CareerOneStop)." url={links.licenses} />
              <LinkRow title="All certifications for this job" detail="National certifications for this job and who issues them (O*NET, U.S. Department of Labor)." url={links.certifications} />
            </View>
          ) : null}
        </View>
      ) : null}

      {pr ? (
        <View style={s.nav}>
          {step > 0 ? <Pressable accessibilityRole="button" onPress={() => setStep((step - 1) as Step)} style={s.secondary}><Text style={s.secondaryText}>‹ {STEPS[step - 1]}</Text></Pressable> : <View />}
          {step < 2
            ? <Pressable accessibilityRole="button" onPress={() => setStep((step + 1) as Step)} style={s.primarySmall}><Text style={s.primaryText}>Next: {STEPS[step + 1]} ›</Text></Pressable>
            : <Pressable accessibilityRole="button" onPress={onBack} style={s.primarySmall}><Text style={s.primaryText}>Compare other jobs</Text></Pressable>}
        </View>
      ) : null}

      <View style={s.sources}>
        <Text style={s.sourcesTitle}>Sources</Text>
        {job.pay ? <Text style={s.sourceLink} onPress={() => Linking.openURL(job.pay!.source.url)}>Pay: {job.pay.source.publisher} (as of {job.pay.asOf})</Text> : null}
        {pr ? <Text style={s.sourceLink} onPress={() => Linking.openURL(links?.onet ?? pr.source.url)}>Job description, tasks, training and study topics: O*NET {pr.externalCode} ({pr.source.publisher}, as of {pr.asOf}), CC BY 4.0</Text> : null}
        {[...new Map(job.prices.map(x => [x.source.url, x])).values()].map(x => (
          <Text key={x.source.url} style={s.sourceLink} onPress={() => Linking.openURL(x.source.url)}>Customer prices: {x.source.publisher}{x.source.title ? `, ${x.source.title}` : ''} (checked {x.asOf})</Text>
        ))}
        {job.selfEmployed ? <Text style={s.sourceLink} onPress={() => Linking.openURL(job.selfEmployed!.source.url)}>Self-employed share: {job.selfEmployed.source.publisher} (checked {job.selfEmployed.asOf})</Text> : null}
        {appr ? <Text style={s.sourceLink} onPress={() => Linking.openURL(appr.source.url)}>Apprenticeships: {appr.source.publisher}, approved occupations list (checked {appr.asOf})</Text> : null}
        {job.credentials.filter(c => c.source).map(c => (
          <Text key={c.name} style={s.sourceLink} onPress={() => Linking.openURL(c.source!.url)}>{c.name}: {c.source!.publisher} (checked {c.asOf})</Text>
        ))}
        <Text style={s.disclaimer}>Rules change and vary by state or province. Always confirm with the official issuer before you pay for training or an exam.</Text>
      </View>
    </View>
  );
}
