-- The owner approved a clean V2 launch. These are the 19 V1 rows exported in
-- backups/production-2026-09-15T06-50-51-607Z before this migration was made.
-- Original poster objects are intentionally retained according to the media
-- retention policy.

delete from public.tournaments
where id in (
  '90ef39dc-9bb7-4f34-871f-a0b314726722',
  'c29fd5f9-5eaf-48b6-af93-4db1332d8781',
  'bb15bd57-40a0-4867-ac1f-1d492e9bb615',
  '42e8dfc9-3120-4e35-9477-fae655b00c8f',
  'dd66b312-f9cb-40cc-94bf-b79d5c59f207',
  '07331b1e-3041-49fa-aaf0-6a2b8e793d11',
  'c8f2a97a-4259-47dd-bf94-74f4e0befd39',
  '5ed1f6c9-4461-47d1-a5a1-aa2536426309',
  '0fb44696-0416-4066-bb7e-58ddd3531f08',
  '7c023e59-7e18-44e6-9704-83eb24af2b19',
  'ebd40971-adfa-4ffe-8d45-576066bf3ab5',
  '4bf90a95-2563-479e-b0ea-21f3f17838d0',
  '51457eda-ecdf-4da5-9054-594418a8fc61',
  '52b5f7c2-a378-4944-9cd4-c78b0fa4f823',
  '7d1cd66a-5c8d-44ed-9f6e-3513eb17db99',
  '72d10974-a4e4-40ce-9a22-a00881c43acd',
  '8a9919f5-dec0-4394-9f35-65f8ccd8d3c5',
  '997f3afc-f08b-4e94-8c42-01d1722d7e79',
  '8aaac334-bb94-413e-b831-604110f7aef2'
);
