-- Most tables with an `employee_id` column were created as plain TEXT with no
-- foreign key to `employees(id)`. PostgREST can only resolve an embedded join
-- like `.select("*, employees!inner(...)")` when a real FK exists in the
-- schema — without it, every such query in the app (KPI/career/rewards/
-- training/etc. list pages) silently returns no matching employee data
-- instead of erroring, so names/departments/emails render blank.
--
-- Only tables where `employee_id` is confirmed to always store a real
-- `employees.id` (HRD/manager forms that pick a specific employee from a
-- dropdown, or server-resolved lookups) are included here. Tables where
-- `employee_id` actually stores the caller's own `users.id` from a
-- self-service action (attendance, leave_requests, complaints, resignations,
-- employee_faces, face_change_requests, survey_responses) are intentionally
-- left untouched — those two id spaces are different per person, so an FK
-- to employees(id) there would be wrong and could break inserts.

ALTER TABLE employee_skills ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE employee_skills ADD CONSTRAINT fk_employee_skills_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE training_enrollments ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE training_enrollments ADD CONSTRAINT fk_training_enrollments_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE warnings ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE warnings ADD CONSTRAINT fk_warnings_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE career_mutations ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE career_mutations ADD CONSTRAINT fk_career_mutations_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE career_promotions ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE career_promotions ADD CONSTRAINT fk_career_promotions_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE development_plans ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE development_plans ADD CONSTRAINT fk_development_plans_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE salary_structures ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE salary_structures ADD CONSTRAINT fk_salary_structures_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE incentive_payments ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE incentive_payments ADD CONSTRAINT fk_incentive_payments_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE employee_contracts ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE employee_contracts ADD CONSTRAINT fk_employee_contracts_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE training_certificates ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE training_certificates ADD CONSTRAINT fk_training_certificates_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE shift_schedules ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE shift_schedules ADD CONSTRAINT fk_shift_schedules_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

ALTER TABLE wa_conversations ALTER COLUMN employee_id TYPE UUID USING employee_id::uuid;
ALTER TABLE wa_conversations ADD CONSTRAINT fk_wa_conversations_employee FOREIGN KEY (employee_id) REFERENCES employees(id);
