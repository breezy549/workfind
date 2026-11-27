-- CA seed: Job Bank Wages 2026 open data (ESDC), national rows, NOC 2021, hourly CAD Q1/median/Q3,
-- reference period 2024-2025, released 2026-11-18. Applied 2026-11-26.
insert into public.sources(url,publisher,title,license,retrieved_at) values
('https://open.canada.ca/data/en/dataset/adad580f-76b0-4502-bd05-20c125de9116','Employment and Social Development Canada (Job Bank)','Job Bank Wages 2026 open data, national (NOC 2021), reference period 2024-2025, released 2026-11-18','Open Government Licence - Canada','2026-11-26');
with v(slug,name,category,noc,q1,med,q3) as (values
('elevator-installer',null,null,'72406',34.1,50,63.26),
('power-line-installer',null,null,'72203',38.75,47.49,54.65),
('refinery-operator',null,null,'93101',42.48,50.3,62),
('chemical-plant-operator',null,null,'93101',42.48,50.3,62),
('power-plant-operator',null,null,'92100',37.56,49,63),
('boiler-operator',null,null,'92100',37.56,49,63),
('substation-relay-repairer',null,null,'72202',38.89,50,59.02),
('ship-engineer',null,null,'72603',33.65,37.29,50),
('locomotive-engineer',null,null,'73310',40,50.48,62.5),
('railroad-conductor',null,null,'73311',36.3,45,50),
('aircraft-mechanic',null,null,'72404',30.6,39,46.58),
('avionics-technician',null,null,'22313',33,43.75,59.13),
('boilermaker',null,null,'72103',45,51,54.21),
('construction-inspector',null,null,'22233',32,40,49),
('telecom-line-installer',null,null,'72204',28,34.65,38.46),
('crane-operator',null,null,'72500',33.86,43.28,49.93),
('drywall-taper',null,null,'73102',27.61,35,42.5),
('millwright',null,null,'72400',30,39,46.75),
('industrial-machinery-mechanic',null,null,'72400',30,39,46.75),
('heavy-equipment-mechanic',null,null,'72401',30,40,48),
('plumber',null,null,'72300',26,35,43),
('electrician',null,null,'72200',26,37,44.79),
('ironworker',null,null,'72105',37.1,44.34,48.47),
('brickmason',null,null,'72320',33,41,47),
('sheet-metal-worker',null,null,'72102',27,35,44.79),
('steamfitter-pipefitter','{"en":"Steamfitters, pipefitters and sprinkler system installers","ko":"스팀·파이프피터"}','construction','72301',34,44.86,52.17),
('industrial-electrician','{"en":"Industrial electricians","ko":"산업 전기공"}','construction','72201',37,43,50),
('instrument-technician','{"en":"Industrial instrument technicians and mechanics","ko":"계장 기술자"}','repair','22312',40,46.31,61.16),
('oil-gas-well-driller','{"en":"Oil and gas well drillers, servicers, testers and related workers","ko":"유정 시추·서비스원"}','energy','83101',35,48,61.85),
('underground-miner','{"en":"Underground production and development miners","ko":"갱내 채굴원"}','energy','83100',35.98,42.99,50)),
n as (insert into public.occupations(slug,name,category) select slug,name::jsonb,category from v where name is not null returning id,slug),
o as (select id,slug from public.occupations where slug in (select slug from v) union select id,slug from n),
c as (insert into public.occupation_codes select o.id,'CA','NOC-2021',v.noc from o join v using(slug))
insert into public.occupation_pay(occupation_id,country_code,currency,pay_unit,pay_low,pay_median,pay_high,as_of,source_id)
  select o.id,'CA','CAD','hour',v.q1,v.med,v.q3,'2026-11-18',(select id from public.sources where url like 'https://open.canada.ca/data/en/dataset/adad580f%') from o join v using(slug);
update public.countries set data_status='partial' where code='CA';
