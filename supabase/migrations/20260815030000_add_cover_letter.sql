-- Cover letters are generated per tailored version (tied to that version's
-- job description and target role), stored alongside it rather than in a
-- separate table, same lifecycle, same RLS via cv_versions' existing policy.

alter table cv_versions add column if not exists cover_letter text;
