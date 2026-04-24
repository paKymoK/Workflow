-- ============================================================
-- Seed: fake cartoon users, groups, and memberships
-- Avatars: DiceBear "adventurer" style (SVG, seeded by username)
-- ============================================================

-- ── Spring Security accounts ─────────────────────────────────
INSERT INTO users (username, password, enabled) VALUES
  ('mickey',    '{noop}password', true),
  ('goku',      '{noop}password', true),
  ('spongebob', '{noop}password', true),
  ('bart',      '{noop}password', true),
  ('luffy',     '{noop}password', true),
  ('naruto',    '{noop}password', true),
  ('astroboy',  '{noop}password', true),
  ('tom',       '{noop}password', true),
  ('jerry',     '{noop}password', true),
  ('pikachu',   '{noop}password', true),
  ('doraemon',  '{noop}password', true),
  ('totoro',    '{noop}password', true);

INSERT INTO authorities (username, authority) VALUES
  ('mickey',    'ROLE_USER'),
  ('goku',      'ROLE_USER'),
  ('spongebob', 'ROLE_USER'),
  ('bart',      'ROLE_USER'),
  ('luffy',     'ROLE_USER'),
  ('naruto',    'ROLE_USER'),
  ('astroboy',  'ROLE_USER'),
  ('tom',       'ROLE_USER'),
  ('jerry',     'ROLE_USER'),
  ('pikachu',   'ROLE_USER'),
  ('doraemon',  'ROLE_USER'),
  ('totoro',    'ROLE_USER');

-- ── User profiles (insert root nodes first to satisfy manager FK) ──
INSERT INTO userinfo (sub, name, email, title, department, manager_sub, avatar) VALUES
  ('mickey',
   'Mickey Mouse',
   'mickey@example.com',
   'Chief Executive Officer',
   'Management',
   NULL,
   'https://api.dicebear.com/9.x/adventurer/svg?seed=mickey'),

  ('goku',
   'Son Goku',
   'goku@example.com',
   'Chief Technology Officer',
   'Engineering',
   'mickey',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=goku'),

  ('spongebob',
   'SpongeBob SquarePants',
   'spongebob@example.com',
   'Marketing Manager',
   'Marketing',
   'mickey',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=spongebob'),

  ('bart',
   'Bart Simpson',
   'bart@example.com',
   'Product Manager',
   'Management',
   'mickey',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=bart'),

  ('luffy',
   'Monkey D. Luffy',
   'luffy@example.com',
   'Tech Lead',
   'Engineering',
   'goku',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=luffy'),

  ('naruto',
   'Naruto Uzumaki',
   'naruto@example.com',
   'Senior Software Engineer',
   'Engineering',
   'goku',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=naruto'),

  ('astroboy',
   'Astro Boy',
   'astroboy@example.com',
   'DevOps Engineer',
   'Operations',
   'goku',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=astroboy'),

  ('doraemon',
   'Doraemon',
   'doraemon@example.com',
   'Data Engineer',
   'Engineering',
   'goku',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=doraemon'),

  ('totoro',
   'Totoro',
   'totoro@example.com',
   'Software Engineer',
   'Engineering',
   'luffy',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=totoro'),

  ('tom',
   'Tom Cat',
   'tom@example.com',
   'UI Designer',
   'Design',
   'bart',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=tom'),

  ('jerry',
   'Jerry Mouse',
   'jerry@example.com',
   'UX Researcher',
   'Design',
   'bart',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=jerry'),

  ('pikachu',
   'Pikachu',
   'pikachu@example.com',
   'Content Creator',
   'Marketing',
   'spongebob',
   'https://api.dicebear.com/9.x/adventurer/svg?seed=pikachu');

-- ── Groups ────────────────────────────────────────────────────
INSERT INTO user_group (id, name, description) VALUES
  ('grp-leadership',   'Leadership',       'Executive and management team'),
  ('grp-engineering',  'Engineering',      'Software engineers and architects'),
  ('grp-design',       'Design',           'UI/UX designers and researchers'),
  ('grp-marketing',    'Marketing',        'Marketing and content team'),
  ('grp-operations',   'Operations',       'DevOps and data engineering');

-- ── Group memberships ─────────────────────────────────────────

-- Leadership: mickey, goku, bart
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-leadership', 'mickey'),
  ('grp-leadership', 'goku'),
  ('grp-leadership', 'bart');

-- Engineering: luffy, naruto, doraemon, totoro, astroboy
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-engineering', 'luffy'),
  ('grp-engineering', 'naruto'),
  ('grp-engineering', 'doraemon'),
  ('grp-engineering', 'totoro'),
  ('grp-engineering', 'astroboy');

-- Design: tom, jerry
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-design', 'tom'),
  ('grp-design', 'jerry');

-- Marketing: spongebob, pikachu
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-marketing', 'spongebob'),
  ('grp-marketing', 'pikachu');

-- Operations: astroboy, naruto, doraemon  (cross-group members)
INSERT INTO user_group_member (group_id, user_sub) VALUES
  ('grp-operations', 'astroboy'),
  ('grp-operations', 'naruto'),
  ('grp-operations', 'doraemon');
