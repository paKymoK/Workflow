-- ============================================================
-- Seed: Vietnamese internal users (LDAP shadow) + FPT guests
-- Internal sub  = bare LDAP username (e.g. tqthai)
-- Guest    sub  = full email       (e.g. tuan.nguyen@fpt.com)
-- Password      = {noop}password   (dev only)
-- ============================================================

-- ── Spring Security accounts ─────────────────────────────────

-- Internal shadow accounts (authenticated via LDAP; JDBC login is intentionally disabled)
INSERT INTO users (username, password, enabled) VALUES
  ('nvhung',   '{noop}locked', false),
  ('ltphuong', '{noop}locked', false),
  ('pdhung',   '{noop}locked', false),
  ('hmlong',   '{noop}locked', false),
  ('tqthai',   '{noop}locked', false),
  ('nvbinh',   '{noop}locked', false),
  ('dqbao',    '{noop}locked', false),
  ('vqhieu',   '{noop}locked', false),
  ('nttung',   '{noop}locked', false),
  ('dtnam',    '{noop}locked', false),
  ('nthuong',  '{noop}locked', false),
  ('btlan',    '{noop}locked', false),
  ('pthoa',    '{noop}locked', false),
  ('ltmai',    '{noop}locked', false),
  ('mtngoc',   '{noop}locked', false),
  ('ttthu',    '{noop}locked', false),
  ('dtyen',    '{noop}locked', false),
  ('cvphuc',   '{noop}locked', false),
  ('nvan',     '{noop}locked', false),
  ('tvduc',    '{noop}locked', false);

-- Guest accounts from FPT (authenticated via JDBC)
INSERT INTO users (username, password, enabled) VALUES
  ('tuan.nguyen@fpt.com',  '{noop}password', true),
  ('ha.tran@fpt.com',      '{noop}password', true),
  ('vinh.le@fpt.com',      '{noop}password', true),
  ('nga.pham@fpt.com',     '{noop}password', true),
  ('thanh.hoang@fpt.com',  '{noop}password', true),
  ('linh.vo@fpt.com',      '{noop}password', true),
  ('cuong.do@fpt.com',     '{noop}password', true),
  ('thuy.bui@fpt.com',     '{noop}password', true),
  ('son.nguyen@fpt.com',   '{noop}password', true),
  ('my.dang@fpt.com',      '{noop}password', true),
  ('tai.ly@fpt.com',       '{noop}password', true),
  ('ngan.phan@fpt.com',    '{noop}password', true),
  ('lam.tran@fpt.com',     '{noop}password', true),
  ('hong.dinh@fpt.com',    '{noop}password', true),
  ('phong.cao@fpt.com',    '{noop}password', true),
  ('kim.mai@fpt.com',      '{noop}password', true),
  ('trung.vu@fpt.com',     '{noop}password', true),
  ('thu.nguyen@fpt.com',   '{noop}password', true),
  ('khoa.luong@fpt.com',   '{noop}password', true),
  ('diem.trinh@fpt.com',   '{noop}password', true);

-- ── Authorities ───────────────────────────────────────────────

INSERT INTO authorities (username, authority) VALUES
  ('nvhung',   'ROLE_USER'),
  ('ltphuong', 'ROLE_USER'),
  ('pdhung',   'ROLE_USER'),
  ('hmlong',   'ROLE_USER'),
  ('tqthai',   'ROLE_USER'),
  ('nvbinh',   'ROLE_USER'),
  ('dqbao',    'ROLE_USER'),
  ('vqhieu',   'ROLE_USER'),
  ('nttung',   'ROLE_USER'),
  ('dtnam',    'ROLE_USER'),
  ('nthuong',  'ROLE_USER'),
  ('btlan',    'ROLE_USER'),
  ('pthoa',    'ROLE_USER'),
  ('ltmai',    'ROLE_USER'),
  ('mtngoc',   'ROLE_USER'),
  ('ttthu',    'ROLE_USER'),
  ('dtyen',    'ROLE_USER'),
  ('cvphuc',   'ROLE_USER'),
  ('nvan',     'ROLE_USER'),
  ('tvduc',    'ROLE_USER'),
  ('tuan.nguyen@fpt.com',  'ROLE_USER'),
  ('ha.tran@fpt.com',      'ROLE_USER'),
  ('vinh.le@fpt.com',      'ROLE_USER'),
  ('nga.pham@fpt.com',     'ROLE_USER'),
  ('thanh.hoang@fpt.com',  'ROLE_USER'),
  ('linh.vo@fpt.com',      'ROLE_USER'),
  ('cuong.do@fpt.com',     'ROLE_USER'),
  ('thuy.bui@fpt.com',     'ROLE_USER'),
  ('son.nguyen@fpt.com',   'ROLE_USER'),
  ('my.dang@fpt.com',      'ROLE_USER'),
  ('tai.ly@fpt.com',       'ROLE_USER'),
  ('ngan.phan@fpt.com',    'ROLE_USER'),
  ('lam.tran@fpt.com',     'ROLE_USER'),
  ('hong.dinh@fpt.com',    'ROLE_USER'),
  ('phong.cao@fpt.com',    'ROLE_USER'),
  ('kim.mai@fpt.com',      'ROLE_USER'),
  ('trung.vu@fpt.com',     'ROLE_USER'),
  ('thu.nguyen@fpt.com',   'ROLE_USER'),
  ('khoa.luong@fpt.com',   'ROLE_USER'),
  ('diem.trinh@fpt.com',   'ROLE_USER');

-- ── Internal user profiles ────────────────────────────────────
-- Insert in hierarchy order (parent before child) to satisfy manager FK

-- Level 0: root
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('nvhung',
   'Nguyen Van Hung',
   'nvhung@mycompany.local',
   'Chief Executive Officer',
   'Management',
   NULL,
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvhung');

-- Level 1: direct reports to CEO
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('ltphuong',
   'Le Thi Phuong',
   'ltphuong@mycompany.local',
   'Chief Operating Officer',
   'Management',
   'nvhung',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ltphuong'),

  ('pdhung',
   'Pham Duc Hung',
   'pdhung@mycompany.local',
   'Chief Technology Officer',
   'Engineering',
   'nvhung',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=pdhung');

-- Level 2: department heads
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('hmlong',
   'Hoang Minh Long',
   'hmlong@mycompany.local',
   'Engineering Manager',
   'Engineering',
   'pdhung',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=hmlong'),

  ('btlan',
   'Bui Thi Lan',
   'btlan@mycompany.local',
   'Head of Product',
   'Product',
   'ltphuong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=btlan'),

  ('ttthu',
   'Tran Thi Thu',
   'ttthu@mycompany.local',
   'Design Lead',
   'Design',
   'ltphuong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ttthu'),

  ('nvan',
   'Nguyen Van An',
   'nvan@mycompany.local',
   'Operations Manager',
   'Operations',
   'ltphuong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvan');

-- Level 3: individual contributors
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('tqthai',
   'Truong Quang Thai',
   'tqthai@mycompany.local',
   'Senior Software Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=tqthai'),

  ('nvbinh',
   'Nguyen Van Binh',
   'nvbinh@mycompany.local',
   'Software Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nvbinh'),

  ('dqbao',
   'Dang Quoc Bao',
   'dqbao@mycompany.local',
   'Software Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=dqbao'),

  ('vqhieu',
   'Vu Quang Hieu',
   'vqhieu@mycompany.local',
   'Software Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=vqhieu'),

  ('nttung',
   'Nguyen Thanh Tung',
   'nttung@mycompany.local',
   'DevOps Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nttung'),

  ('dtnam',
   'Do Thanh Nam',
   'dtnam@mycompany.local',
   'Backend Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=dtnam'),

  ('nthuong',
   'Nguyen Thi Huong',
   'nthuong@mycompany.local',
   'QA Engineer',
   'Engineering',
   'hmlong',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=nthuong'),

  ('pthoa',
   'Phan Thi Hoa',
   'pthoa@mycompany.local',
   'Product Manager',
   'Product',
   'btlan',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=pthoa'),

  ('ltmai',
   'Ly Thi Mai',
   'ltmai@mycompany.local',
   'Product Analyst',
   'Product',
   'btlan',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=ltmai'),

  ('mtngoc',
   'Mai Thi Ngoc',
   'mtngoc@mycompany.local',
   'Business Analyst',
   'Product',
   'btlan',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=mtngoc'),

  ('dtyen',
   'Dinh Thi Yen',
   'dtyen@mycompany.local',
   'UI Designer',
   'Design',
   'ttthu',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=dtyen'),

  ('cvphuc',
   'Cao Van Phuc',
   'cvphuc@mycompany.local',
   'UX Designer',
   'Design',
   'ttthu',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=cvphuc'),

  ('tvduc',
   'Tran Van Duc',
   'tvduc@mycompany.local',
   'Site Reliability Engineer',
   'Operations',
   'nvan',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=tvduc');

-- ── Guest profiles (title/department NULL — admin configures) ─
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('tuan.nguyen@fpt.com',  'Nguyen Minh Tuan',  'tuan.nguyen@fpt.com',  NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=tuannguyen'),
  ('ha.tran@fpt.com',      'Tran Thi Ha',        'ha.tran@fpt.com',      NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=hatran'),
  ('vinh.le@fpt.com',      'Le Quang Vinh',      'vinh.le@fpt.com',      NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=vinhle'),
  ('nga.pham@fpt.com',     'Pham Thi Nga',       'nga.pham@fpt.com',     NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=ngapham'),
  ('thanh.hoang@fpt.com',  'Hoang Duc Thanh',    'thanh.hoang@fpt.com',  NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=thanhhoang'),
  ('linh.vo@fpt.com',      'Vo Thi Linh',        'linh.vo@fpt.com',      NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=linhvo'),
  ('cuong.do@fpt.com',     'Do Van Cuong',        'cuong.do@fpt.com',     NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=cuongdo'),
  ('thuy.bui@fpt.com',     'Bui Thi Thuy',       'thuy.bui@fpt.com',     NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=thuybui'),
  ('son.nguyen@fpt.com',   'Nguyen Hong Son',     'son.nguyen@fpt.com',   NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=sonnguyen'),
  ('my.dang@fpt.com',      'Dang Thi My',         'my.dang@fpt.com',      NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=mydang'),
  ('tai.ly@fpt.com',       'Ly Van Tai',           'tai.ly@fpt.com',       NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=taily'),
  ('ngan.phan@fpt.com',    'Phan Thi Ngan',       'ngan.phan@fpt.com',    NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=nganphan'),
  ('lam.tran@fpt.com',     'Tran Van Lam',        'lam.tran@fpt.com',     NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=lamtran'),
  ('hong.dinh@fpt.com',    'Dinh Thi Hong',       'hong.dinh@fpt.com',    NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=hongdinh'),
  ('phong.cao@fpt.com',    'Cao Van Phong',        'phong.cao@fpt.com',    NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=phongcao'),
  ('kim.mai@fpt.com',      'Mai Thi Kim',          'kim.mai@fpt.com',      NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=kimmai'),
  ('trung.vu@fpt.com',     'Vu Quang Trung',      'trung.vu@fpt.com',     NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=trungvu'),
  ('thu.nguyen@fpt.com',   'Nguyen Thi Thu',      'thu.nguyen@fpt.com',   NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=thunguyen'),
  ('khoa.luong@fpt.com',   'Luong Van Khoa',      'khoa.luong@fpt.com',   NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=khoaluong'),
  ('diem.trinh@fpt.com',   'Trinh Thi Diem',      'diem.trinh@fpt.com',   NULL, NULL, NULL, 'https://api.dicebear.com/9.x/adventurer/svg?seed=diemtrinh');

-- ── Groups ────────────────────────────────────────────────────
INSERT INTO user_group (id, name, description) VALUES
  ('grp-management',  'Management',  'Executive and department heads'),
  ('grp-engineering', 'Engineering', 'Software engineers, DevOps, and QA'),
  ('grp-product',     'Product',     'Product managers and analysts'),
  ('grp-design',      'Design',      'UI/UX designers'),
  ('grp-operations',  'Operations',  'SRE and infrastructure');

-- ── Group memberships ─────────────────────────────────────────
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-management', 'nvhung'),
  ('grp-management', 'ltphuong'),
  ('grp-management', 'pdhung'),
  ('grp-management', 'hmlong'),
  ('grp-management', 'btlan');

INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-engineering', 'hmlong'),
  ('grp-engineering', 'tqthai'),
  ('grp-engineering', 'nvbinh'),
  ('grp-engineering', 'dqbao'),
  ('grp-engineering', 'vqhieu'),
  ('grp-engineering', 'nttung'),
  ('grp-engineering', 'dtnam'),
  ('grp-engineering', 'nthuong');

INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-product', 'btlan'),
  ('grp-product', 'pthoa'),
  ('grp-product', 'ltmai'),
  ('grp-product', 'mtngoc');

INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-design', 'ttthu'),
  ('grp-design', 'dtyen'),
  ('grp-design', 'cvphuc');

INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-operations', 'nvan'),
  ('grp-operations', 'tvduc'),
  ('grp-operations', 'nttung');
