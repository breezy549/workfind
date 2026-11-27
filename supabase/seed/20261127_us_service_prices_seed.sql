-- What customers pay (national cost-guide ranges) and BLS self-employed share. Checked 2026-11-27.
with s(k,url,pub,title) as (values
 ('hg-plumb','https://homeguide.com/costs/plumber-cost','HomeGuide','Plumber cost guide'),
 ('angi-elec','https://angi.com/articles/how-much-does-it-cost-hire-electrician.htm','Angi','Electrician cost guide'),
 ('hg-elec','https://homeguide.com/costs/electrician-cost-per-hour','HomeGuide','Electrician cost per hour'),
 ('hg-dry','https://homeguide.com/costs/drywall-repair-cost','HomeGuide','Drywall repair cost'),
 ('hg-mason','https://homeguide.com/costs/repair-brick-masonry-work-cost','HomeGuide','Brick and masonry repair cost'),
 ('bls-plumb','https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm','U.S. Bureau of Labor Statistics, Occupational Outlook Handbook','Plumbers, pipefitters, and steamfitters: work environment'),
 ('bls-elec','https://www.bls.gov/ooh/construction-and-extraction/electricians.htm','U.S. Bureau of Labor Statistics, Occupational Outlook Handbook','Electricians: work environment'),
 ('bls-dry','https://www.bls.gov/ooh/construction-and-extraction/drywall-and-ceiling-tile-installers-and-tapers.htm','U.S. Bureau of Labor Statistics, Occupational Outlook Handbook','Drywall installers and tapers: work environment')),
si as (insert into public.sources(url,publisher,title,retrieved_at) select url,pub,title,'2026-11-27' from s returning id,url),
p(k,slug,item,unit,lo,hi,typ,ord) as (values
 ('hg-plumb','plumber','Hourly rate','hour',45,150,null::numeric,1),
 ('hg-plumb','plumber','Service call fee','visit',50,200,null,2),
 ('hg-plumb','plumber','Unclog a drain','job',100,275,null,3),
 ('hg-plumb','plumber','Install a water heater','job',600,1800,null,4),
 ('angi-elec','electrician','Hourly rate','hour',50,130,null::numeric,1),
 ('hg-elec','electrician','Service call fee (first hour)','visit',100,200,null,2),
 ('hg-elec','electrician','Install an outlet','job',150,350,null,3),
 ('hg-elec','electrician','Replace an electrical panel','job',1400,2800,null,4),
 ('hg-dry','drywall-taper','Hourly rate','hour',40,100,null::numeric,1),
 ('hg-dry','drywall-taper','Patch one small hole','job',50,150,null,2),
 ('hg-dry','drywall-taper','Typical drywall repair','job',200,750,420,3),
 ('hg-mason','brickmason','Hourly rate','hour',40,100,null::numeric,1),
 ('hg-mason','brickmason','Brick repair','job',500,2500,2000,2)),
ins as (insert into public.service_prices(occupation_id,country_code,item,unit,currency,price_low,price_high,price_typical,sort,source_id,as_of)
 select o.id,'US',jsonb_build_object('en',p.item),p.unit,'USD',p.lo,p.hi,p.typ,p.ord,si.id,'2026-11-27'
 from p join s on s.k=p.k join si on si.url=s.url join public.occupations o on o.slug=p.slug returning 1),
m(k,slug,pct) as (values ('bls-plumb','plumber',8),('bls-elec','electrician',7),('bls-dry','drywall-taper',19))
insert into public.occupation_market(occupation_id,country_code,self_employed_pct,source_id,as_of)
select o.id,'US',m.pct,si.id,'2026-11-27' from m join s on s.k=m.k join si on si.url=s.url join public.occupations o on o.slug=m.slug;
