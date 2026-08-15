-- Add Europass/EU, Finland, France, Australia, and Canada region profiles.
-- See docs/04-cv-standards.md for research and docs/decisions/0003-region-profile-schema.md
-- for the data-not-templates approach. `fields` is written in the same
-- historical shape as the uk/de rows for consistency even though the app's
-- RegionProfile type now only reads `nationality`, nothing queries this
-- table for rendering, it exists purely to satisfy cv_master's foreign key.

insert into region_profiles (id, label, fields, length_guidance, default_section_order)
values
  (
    'eu',
    'Europass / EU',
    '{"photo":"optional","dateOfBirth":"optional","fatherName":"hidden","citizenshipNumber":"hidden","nationality":"optional","declaration":false}'::jsonb,
    '{"minPages":1,"maxPages":2}'::jsonb,
    '["summary","experience","education","skills","projects"]'::jsonb
  ),
  (
    'fi',
    'Finland',
    '{"photo":"optional","dateOfBirth":"hidden","fatherName":"hidden","citizenshipNumber":"hidden","nationality":"hidden","declaration":false}'::jsonb,
    '{"minPages":1,"maxPages":2}'::jsonb,
    '["summary","experience","education","skills","projects"]'::jsonb
  ),
  (
    'fr',
    'France',
    '{"photo":"optional","dateOfBirth":"hidden","fatherName":"hidden","citizenshipNumber":"hidden","nationality":"hidden","declaration":false}'::jsonb,
    '{"minPages":1,"maxPages":2}'::jsonb,
    '["summary","experience","education","skills","projects"]'::jsonb
  ),
  (
    'au',
    'Australia',
    '{"photo":"hidden","dateOfBirth":"hidden","fatherName":"hidden","citizenshipNumber":"hidden","nationality":"hidden","declaration":false}'::jsonb,
    '{"minPages":2,"maxPages":3}'::jsonb,
    '["summary","experience","education","skills","projects"]'::jsonb
  ),
  (
    'ca',
    'Canada',
    '{"photo":"hidden","dateOfBirth":"hidden","fatherName":"hidden","citizenshipNumber":"hidden","nationality":"hidden","declaration":false}'::jsonb,
    '{"minPages":1,"maxPages":2}'::jsonb,
    '["summary","experience","education","skills","projects"]'::jsonb
  )
on conflict (id) do nothing;
