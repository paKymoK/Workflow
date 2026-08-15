-- ============================================================
-- Seed: test/dev-only Documents & Policies, ported from the mobile app's old local mock
-- (frontend/mobile-frontend/src/data/policies.ts) so the feed has real content on first run.
-- Raw SQL is fine here — like News, nothing downstream consumes documents via Kafka.
-- ============================================================

-- created_at is set explicitly, same reasoning as seed-news.sql: raw SQL bypasses R2DBC's
-- auditing framework, so a null created_at would break sort order and relative-time display.
INSERT INTO document_post (category, title, version, content, created_at) VALUES
  ('HR Policies', 'Recruitment & Selection Policy', 'v1.0',
   E'This policy governs fair, transparent, and non-discriminatory hiring at CMC Global.\n\n1. All vacancies must be approved by the department head and HR before posting.\n2. Internal candidates are prioritized where qualifications are equivalent.\n3. Structured interviews with at least two interviewers are required.\n4. Background and reference checks are mandatory for all positions.\n5. Hiring decisions must be documented and filed with HR within 5 business days.',
   '2025-01-10'::timestamptz),

  ('HR Policies', 'Grievance Handling Policy', 'v1.0',
   E'CMC Global is committed to resolving workplace grievances promptly and fairly.\n\n1. Employees may raise grievances verbally or in writing to their direct supervisor.\n2. All grievances must be acknowledged within 2 working days.\n3. A formal investigation will be conducted within 7 working days.\n4. The employee will receive a written response with the outcome.\n5. Appeals may be escalated to the HR Director within 5 days of the decision.',
   '2025-02-03'::timestamptz),

  ('Attendance Policy', 'Timekeeping & Punctuality', 'v1.0',
   E'All employees are expected to report on time and maintain their scheduled shifts.\n\n1. Employees must clock in within 5 minutes of their scheduled start time.\n2. Tardiness of more than 3 times per month will result in a written warning.\n3. Unexcused absences must be communicated at least 1 hour before the shift start.\n4. Three unexcused absences in a calendar month triggers a disciplinary review.',
   '2025-03-15'::timestamptz),

  ('Attendance Policy', 'Leave & Absence Policy', 'v1.0',
   E'CMC Global provides 15 days annual leave, 10 days sick leave, and statutory entitlements.\n\n1. Annual leave must be submitted at least 3 days in advance via the portal.\n2. Sick leave beyond 2 consecutive days requires a medical certificate.\n3. Unpaid leave may be granted at the discretion of the department head.\n4. Leave cannot be carried forward beyond 5 days into the following year.',
   '2025-03-15'::timestamptz),

  ('Code of Conduct', 'Workplace Behavior Standards', 'v1.0',
   E'All employees must conduct themselves professionally and respectfully at all times.\n\n1. Treat all colleagues, supervisors, and visitors with dignity and respect.\n2. Harassment, bullying, or discrimination of any kind is strictly prohibited.\n3. Maintain a clean and safe workspace at all times.\n4. Company property must be used for business purposes only.\n5. Violation of this policy may result in immediate disciplinary action.',
   '2024-12-01'::timestamptz),

  ('IT & Data Usage Policy', 'Acceptable Use of IT Resources', 'v1.0',
   E'Company IT resources are provided for business use and must be used responsibly.\n\n1. Personal use of company devices must be minimal and not interfere with work.\n2. Employees must not install unauthorized software on company devices.\n3. All data stored on company systems remains the property of CMC Global.\n4. Employees must use strong passwords and never share login credentials.\n5. Any suspected security incident must be reported to IT immediately.',
   '2024-11-20'::timestamptz),

  ('Compensation & Benefits', 'Salary & Payroll Policy', 'v1.0',
   E'CMC Global is committed to competitive and fair compensation for all employees.\n\n1. Salaries are reviewed annually, with adjustments effective April 1st.\n2. Net salary is deposited by the 5th of the following month.\n3. Overtime is paid at 150% of the base hourly rate for weekday OT.\n4. All components are itemized in the monthly payslip on the portal.\n5. Salary information is strictly confidential.',
   '2025-04-01'::timestamptz),

  ('Compensation & Benefits', 'Benefits Entitlements', 'v1.0',
   E'All full-time employees are entitled to the following benefits:\n\n1. Compulsory social insurance as required by Vietnamese labor law.\n2. Private health insurance covering the employee and one dependent.\n3. Annual performance bonus based on company and individual KPI results.\n4. Meal subsidy of ₫25,000 per working day.\n5. Transportation allowance of ₫700,000 per month.',
   '2025-04-01'::timestamptz);

-- A handful of acknowledgments so the admin table's completion count isn't always "0/N".
INSERT INTO document_acknowledgment (document_id, employee_sub, created_at) VALUES
  ((SELECT id FROM document_post WHERE title = 'Workplace Behavior Standards'), 'ndtu24', now() - interval '20 days'),
  ((SELECT id FROM document_post WHERE title = 'Workplace Behavior Standards'), 'nmngoc5', now() - interval '19 days'),
  ((SELECT id FROM document_post WHERE title = 'Workplace Behavior Standards'), 'natuan25', now() - interval '18 days'),
  ((SELECT id FROM document_post WHERE title = 'Acceptable Use of IT Resources'), 'ndtu24', now() - interval '10 days'),
  ((SELECT id FROM document_post WHERE title = 'Acceptable Use of IT Resources'), 'btngoc2', now() - interval '9 days'),
  ((SELECT id FROM document_post WHERE title = 'Timekeeping & Punctuality'), 'nmngoc5', now() - interval '5 days');
