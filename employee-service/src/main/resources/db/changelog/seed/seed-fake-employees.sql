-- ============================================================
-- Seed: test/dev-only employee records mirroring auth-service's
-- fake users (auth-service/src/main/resources/db/changelog/seed/seed-fake-users.sql
-- and init/init-admin-user.sql) so the same subs resolve on both sides
-- while employee-service has no real HR feed yet.
--
-- manager_id is wired up via subquery on sub, so insertion order below
-- must keep each manager's row before their reports' rows (matches the
-- order manager_sub is set in auth-service's seed).
-- ============================================================

INSERT INTO employee (sub, employee_code, name, email, title, department, status) VALUES
  ('admin', 'EMP-00000', 'Admin', 'admin@gmail.com', NULL, NULL, 'ACTIVE');

-- Manager (no manager_sub in auth-service's seed)
INSERT INTO employee (sub, employee_code, name, email, avatar_url, title, department, status) VALUES
  ('ndtu24', 'EMP-00001', 'Nguyen Duc Tu', 'ndtu24@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ndtu24',
   'IT Service Manager', 'IT Support', 'ACTIVE');

-- L3
INSERT INTO employee (sub, employee_code, name, email, avatar_url, title, department, manager_id, status) VALUES
  ('tqthai', 'EMP-00002', 'Truong Quang Thai', 'tqthai@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=tqthai',
   'Senior IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE');

-- L2
INSERT INTO employee (sub, employee_code, name, email, avatar_url, title, department, manager_id, status) VALUES
  ('nvtu3', 'EMP-00003', 'Nguyen Van Tu', 'nvtu3@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvtu3',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('natuan25', 'EMP-00004', 'Nguyen Anh Tuan', 'natuan25@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=natuan25',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE');

-- L1
INSERT INTO employee (sub, employee_code, name, email, avatar_url, title, department, manager_id, status) VALUES
  ('btngoc2', 'EMP-00005', 'Bui Thuy Ngoc', 'btngoc2@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=btngoc2',
   'IT Support Analyst', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('nmngoc5', 'EMP-00006', 'Nguyen Minh Ngoc', 'nmngoc5@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nmngoc5',
   'IT Support Analyst', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('nttdung9', 'EMP-00007', 'Nguyen Thi Thuy Dung', 'nttdung9@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nttdung9',
   'IT Support Analyst', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('dvtuan4', 'EMP-00008', 'Do Van Tuan', 'dvtuan4@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=dvtuan4',
   'IT Support Analyst', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('ldduc', 'EMP-00009', 'Le Dinh Duc', 'ldduc@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ldduc',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('ndtoi', 'EMP-00010', 'Nguyen Dinh Toi', 'ndtoi@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ndtoi',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('nmhoang6', 'EMP-00011', 'Nguyen Minh Hoang', 'nmhoang6@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nmhoang6',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('ntnghia4', 'EMP-00012', 'Nguyen Tuan Nghia', 'ntnghia4@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ntnghia4',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('nvtuan16', 'EMP-00013', 'Nguyen Vi Tuan', 'nvtuan16@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvtuan16',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('nxmanh1', 'EMP-00014', 'Nguyen Xuan Manh', 'nxmanh1@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nxmanh1',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('phanh5', 'EMP-00015', 'Pham Hoang Anh', 'phanh5@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=phanh5',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('ptduong1', 'EMP-00016', 'Pham Tung Duong', 'ptduong1@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ptduong1',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE'),

  ('txdat2', 'EMP-00017', 'Tran Xuan Dat', 'txdat2@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=txdat2',
   'IT Support Engineer', 'IT Support',
   (SELECT id FROM employee WHERE sub = 'ndtu24'), 'ACTIVE');
