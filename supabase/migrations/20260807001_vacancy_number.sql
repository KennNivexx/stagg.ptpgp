-- Vacancy number (VAC-YYYY-NNNNNN) so each job posting has a unique,
-- spec-required identifier instead of only an internal UUID.
alter table lowongan_kerja add column if not exists vacancy_number text unique;
