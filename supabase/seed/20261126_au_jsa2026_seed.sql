-- AU seed: Jobs and Skills Australia ANZSCO occupation data Feb 2026, Table 4 median full-time hourly earnings (AUD),
-- from ABS Survey of Employee Earnings and Hours May 2025. 4-digit ANZSCO groups are broader than our occupations. Applied 2026-11-26.
insert into public.sources(url,publisher,title,license,retrieved_at) values
('https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles','Jobs and Skills Australia','ANZSCO Occupation data February 2026, Table 4: median full-time hourly earnings (ABS Survey of Employee Earnings and Hours, May 2025); all-occupation median $47/h','CC BY 4.0','2026-11-26');
with v(slug,code,med) as (values
('refinery-operator','3992',82),('power-plant-operator','3992',82),('gas-plant-operator','3992',82),('chemical-plant-operator','3992',82),
('crane-operator','7121',83),('power-line-installer','3422',71),('substation-relay-repairer','3422',71),
('aircraft-mechanic','3231',52),('avionics-technician','3231',52),('electrician','3411',55),('plumber','3341',47),
('brickmason','3311',53),('ironworker','8217',66),('locomotive-engineer','7313',68),('millwright','3232',60),
('industrial-machinery-mechanic','3232',60),('telecom-line-installer','3424',53),('construction-inspector','3121',54),
('underground-miner','7122',65),('oil-gas-well-driller','7122',65),('boilermaker','3223',44)),
o as (select id,slug from public.occupations where slug in (select slug from v)),
c as (insert into public.occupation_codes select o.id,'AU','ANZSCO-4',v.code from o join v using(slug))
insert into public.occupation_pay(occupation_id,country_code,currency,pay_unit,pay_median,as_of,source_id)
  select o.id,'AU','AUD','hour',v.med,'2025-05-01',(select id from public.sources where url like 'https://www.jobsandskills.gov.au/%') from o join v using(slug);
update public.countries set data_status='partial' where code='AU';
