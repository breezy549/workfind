-- US seed: BLS OEWS May 2025 national (p25/median/p75 hourly USD) + O*NET 29.1 (Nov 2024) Job Zones.
-- Selection: SOC groups 37-53, median hourly >= 1.2x all-occupation median ($24.51), Job Zone <= 3, supervisors/tiny occupations excluded.
insert into public.sources(url,publisher,title,license,retrieved_at) values
('https://www.bls.gov/oes/special-requests/oesm25nat.zip','U.S. Bureau of Labor Statistics','OEWS May 2025 national estimates (cross-industry)','Public domain (U.S. government work)','2026-11-26'),
('https://www.onetcenter.org/database.html','National Center for O*NET Development','O*NET 29.1 Database (Nov 2024): Job Zones','CC BY 4.0','2026-11-26');
with v(slug,name,category,soc,p25,med,p75,req) as (values
('elevator-installer','{"en": "Elevator and Escalator Installers and Repairers", "ko": "승강기 설치·정비원"}','construction','47-4021',38.12,52.84,65.25,'{"onet_job_zone": 3, "us_employment": 23790}'),
('power-line-installer','{"en": "Electrical Power-Line Installers and Repairers", "ko": "송배전선 전기원"}','energy','49-9051',32.34,45.83,52.76,'{"onet_job_zone": 2, "us_employment": 131070}'),
('refinery-operator','{"en": "Petroleum Pump System Operators, Refinery Operators, and Gaugers", "ko": "정유 공정 운전원"}','energy','51-8093',37.27,46.5,51.12,'{"onet_job_zone": 2, "us_employment": 33160}'),
('power-plant-operator','{"en": "Power Plant Operators", "ko": "발전소 운전원"}','energy','51-8013',38.31,49.06,57.25,'{"onet_job_zone": 2, "us_employment": 29320}'),
('gas-plant-operator','{"en": "Gas Plant Operators", "ko": "가스 플랜트 운전원"}','energy','51-8092',36.96,42.22,48.49,'{"onet_job_zone": 2, "us_employment": 18030}'),
('substation-relay-repairer','{"en": "Electrical and Electronics Repairers, Powerhouse, Substation, and Relay", "ko": "변전·계전 설비 정비원"}','energy','49-2095',39.35,49.53,57.15,'{"onet_job_zone": 3, "us_employment": 20720}'),
('rail-signal-repairer','{"en": "Signal and Track Switch Repairers", "ko": "철도 신호·선로전환기 정비원"}','transport','49-9097',38.33,44.45,47.75,'{"onet_job_zone": 3, "us_employment": 8720}'),
('ship-engineer','{"en": "Ship Engineers", "ko": "선박 기관사"}','transport','53-5031',39.49,52.66,65.27,'{"onet_job_zone": 3, "us_employment": 8400}'),
('locomotive-engineer','{"en": "Locomotive Engineers", "ko": "철도 기관사"}','transport','53-4011',36.15,39.14,44.84,'{"onet_job_zone": 2, "us_employment": 33470}'),
('railroad-conductor','{"en": "Railroad Conductors and Yardmasters", "ko": "철도 차장·조차원"}','transport','53-4031',31.54,37.5,40.3,'{"onet_job_zone": 2, "us_employment": 46440}'),
('aircraft-mechanic','{"en": "Aircraft Mechanics and Service Technicians", "ko": "항공 정비사"}','repair','49-3011',30.11,38.4,47.66,'{"onet_job_zone": 3, "us_employment": 138090}'),
('avionics-technician','{"en": "Avionics Technicians", "ko": "항공 전자 정비사"}','repair','49-2091',30.72,39.56,47.65,'{"onet_job_zone": 3, "us_employment": 18830}'),
('boiler-operator','{"en": "Stationary Engineers and Boiler Operators", "ko": "보일러·설비 기관원"}','energy','51-8021',30.37,37.8,48.63,'{"onet_job_zone": 3, "us_employment": 28250}'),
('chemical-plant-operator','{"en": "Chemical Plant and System Operators", "ko": "화학 공정 운전원"}','manufacturing','51-8091',29.01,37.56,47.44,'{"onet_job_zone": 2, "us_employment": 16610}'),
('boilermaker','{"en": "Boilermakers", "ko": "보일러 제관공"}','construction','47-2011',31.13,36.74,45.88,'{"onet_job_zone": 3, "us_employment": 10190}'),
('construction-inspector','{"en": "Construction and Building Inspectors", "ko": "건축·건설 검사원"}','construction','47-4011',28.3,35.91,45.54,'{"onet_job_zone": 3, "us_employment": 146720}'),
('telecom-line-installer','{"en": "Telecommunications Line Installers and Repairers", "ko": "통신선로 설치·정비원"}','repair','49-9052',26.11,35.73,46.08,'{"onet_job_zone": 2, "us_employment": 97720}'),
('commercial-diver','{"en": "Commercial Divers", "ko": "산업 잠수사"}','construction','49-9092',26.35,35.09,48.82,'{"onet_job_zone": 3, "us_employment": 3450}'),
('crane-operator','{"en": "Crane and Tower Operators", "ko": "크레인 운전원"}','construction','53-7021',25.29,32.73,40.0,'{"onet_job_zone": 3, "us_employment": 42890}'),
('drywall-taper','{"en": "Tapers", "ko": "석고보드 마감공"}','construction','47-2082',25.35,32.82,42.57,'{"onet_job_zone": 2, "us_employment": 12840}'),
('cnc-programmer','{"en": "Computer Numerically Controlled Tool Programmers", "ko": "CNC 프로그래머"}','manufacturing','51-9162',28.01,32.75,39.37,'{"onet_job_zone": 3, "us_employment": 28500}'),
('millwright','{"en": "Millwrights", "ko": "설비 조립·설치공"}','manufacturing','49-9044',27.11,31.59,39.18,'{"onet_job_zone": 2, "us_employment": 40330}'),
('heavy-equipment-mechanic','{"en": "Mobile Heavy Equipment Mechanics, Except Engines", "ko": "중장비 정비사"}','repair','49-3042',27.39,31.5,38.11,'{"onet_job_zone": 3, "us_employment": 176600}'),
('industrial-machinery-mechanic','{"en": "Industrial Machinery Mechanics", "ko": "산업기계 정비원"}','repair','49-9041',26.45,31.02,37.88,'{"onet_job_zone": 3, "us_employment": 439640}'),
('wind-turbine-technician','{"en": "Wind Turbine Service Technicians", "ko": "풍력발전 정비원"}','energy','49-9081',28.29,30.83,37.51,'{"onet_job_zone": 3, "us_employment": 9980}'),
('tool-and-die-maker','{"en": "Tool and Die Makers", "ko": "금형공"}','manufacturing','51-4111',24.75,30.79,37.87,'{"onet_job_zone": 3, "us_employment": 56930}'),
('plumber','{"en": "Plumbers, Pipefitters, and Steamfitters", "ko": "배관공"}','construction','47-2152',24.13,30.67,40.92,'{"onet_job_zone": 3, "us_employment": 465840}'),
('electrician','{"en": "Electricians", "ko": "전기공"}','construction','47-2111',23.76,30.38,40.36,'{"onet_job_zone": 3, "us_employment": 757220}'),
('ironworker','{"en": "Structural Iron and Steel Workers", "ko": "철골공"}','construction','47-2221',23.98,30.18,39.74,'{"onet_job_zone": 2, "us_employment": 68380}'),
('rigger','{"en": "Riggers", "ko": "리거(중량물 줄걸이)"}','construction','49-9096',23.18,30.12,38.55,'{"onet_job_zone": 2, "us_employment": 22530}'),
('brickmason','{"en": "Brickmasons and Blockmasons", "ko": "조적공"}','construction','47-2021',24.57,29.87,38.15,'{"onet_job_zone": 2, "us_employment": 52550}'),
('sheet-metal-worker','{"en": "Sheet Metal Workers", "ko": "판금·덕트공"}','construction','47-2211',22.99,29.71,39.24,'{"onet_job_zone": 2, "us_employment": 119770}'),
('diesel-mechanic','{"en": "Bus and Truck Mechanics and Diesel Engine Specialists", "ko": "디젤·트럭 정비사"}','repair','49-3031',24.3,29.7,36.29,'{"onet_job_zone": 3, "us_employment": 289960}')),
o as (insert into public.occupations(slug,name,category) select slug,name::jsonb,category from v returning id,slug),
c as (insert into public.occupation_codes select o.id,'US','SOC-2018',v.soc from o join v using(slug)),
p as (insert into public.occupation_pay(occupation_id,country_code,currency,pay_unit,pay_low,pay_median,pay_high,as_of,source_id)
  select o.id,'US','USD','hour',v.p25,v.med,v.p75,'2025-05-01',(select id from public.sources where url like '%oesm25nat.zip') from o join v using(slug))
insert into public.occupation_requirements(occupation_id,country_code,kind,mandatory,detail,source_id,as_of)
  select o.id,'US','education',false,v.req::jsonb,(select id from public.sources where url like '%onetcenter%'),'2024-11-01' from o join v using(slug);
update public.countries set data_status='partial' where code='US';
