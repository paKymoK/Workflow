-- ============================================================
-- Seed: test/dev-only employee records mirroring auth-service's
-- fake users (auth-service/src/main/resources/db/changelog/seed/seed-fake-users.sql
-- and init/init-admin-user.sql) so the same subs resolve on both sides
-- while employee-service has no real HR feed yet.
--
-- manager_sub is copied straight from auth-service's seed (same column,
-- same values). ndtu24 (the manager) is inserted in its own statement
-- before anything that references it as manager_sub, matching how
-- auth-service's own seed avoids self-referencing within one multi-row
-- INSERT.
-- ============================================================

INSERT INTO department (name) VALUES ('IT Support');

INSERT INTO employee (sub, name, email, title, department_id, status) VALUES
  ('admin', 'Admin', 'admin@gmail.com', NULL, NULL, 'ACTIVE');

-- Manager (no manager_sub in auth-service's seed)
INSERT INTO employee (sub, name, email, avatar_url, title, department_id, status) VALUES
  ('ndtu24', 'Nguyen Duc Tu', 'ndtu24@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ndtu24',
   'IT Service Manager', (SELECT id FROM department WHERE name = 'IT Support'), 'ACTIVE');

-- L3
INSERT INTO employee (sub, name, email, avatar_url, title, department_id, manager_sub, status) VALUES
  ('tqthai', 'Truong Quang Thai', 'tqthai@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=tqthai',
   'Senior IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE');

-- L2
INSERT INTO employee (sub, name, email, avatar_url, title, department_id, manager_sub, status) VALUES
  ('nvtu3', 'Nguyen Van Tu', 'nvtu3@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvtu3',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('natuan25', 'Nguyen Anh Tuan', 'natuan25@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=natuan25',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE');

-- L1
INSERT INTO employee (sub, name, email, avatar_url, title, department_id, manager_sub, status) VALUES
  ('btngoc2', 'Bui Thuy Ngoc', 'btngoc2@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=btngoc2',
   'IT Support Analyst', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('nmngoc5', 'Nguyen Minh Ngoc', 'nmngoc5@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nmngoc5',
   'IT Support Analyst', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('nttdung9', 'Nguyen Thi Thuy Dung', 'nttdung9@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nttdung9',
   'IT Support Analyst', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('dvtuan4', 'Do Van Tuan', 'dvtuan4@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=dvtuan4',
   'IT Support Analyst', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('ldduc', 'Le Dinh Duc', 'ldduc@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ldduc',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('ndtoi', 'Nguyen Dinh Toi', 'ndtoi@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ndtoi',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('nmhoang6', 'Nguyen Minh Hoang', 'nmhoang6@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nmhoang6',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('ntnghia4', 'Nguyen Tuan Nghia', 'ntnghia4@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ntnghia4',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('nvtuan16', 'Nguyen Vi Tuan', 'nvtuan16@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvtuan16',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('nxmanh1', 'Nguyen Xuan Manh', 'nxmanh1@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nxmanh1',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('phanh5', 'Pham Hoang Anh', 'phanh5@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=phanh5',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('ptduong1', 'Pham Tung Duong', 'ptduong1@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ptduong1',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE'),

  ('txdat2', 'Tran Xuan Dat', 'txdat2@mycompany.local',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=txdat2',
   'IT Support Engineer', (SELECT id FROM department WHERE name = 'IT Support'), 'ndtu24', 'ACTIVE');
