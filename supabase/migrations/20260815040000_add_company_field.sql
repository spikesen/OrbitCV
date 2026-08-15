-- Company name, kept alongside target_role so the cover letter can address
-- a real employer by name instead of a generic "Dear Hiring Manager" every
-- time. See docs/decisions for why this matters: a letter with no company
-- reference is exactly the kind of tell that makes it read as templated.

alter table cv_versions add column if not exists company text;
