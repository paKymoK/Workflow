INSERT INTO users(username, password, enabled)
VALUES ('admin', '{noop}admin', true);

INSERT INTO authorities(username, authority)
VALUES ('admin', 'ROLE_ADMIN'), ('admin', 'ROLE_USER');

INSERT INTO userinfo(sub, name, email)
VALUES ('admin', 'admin', 'tqthai@gmail.com');

INSERT INTO users(username, password, enabled)
VALUES ('tqthai', '{noop}123456', true);

INSERT INTO authorities(username, authority)
VALUES ('tqthai', 'ROLE_ADMIN'), ('tqthai', 'ROLE_USER');

INSERT INTO userinfo(sub, name, email)
VALUES ('tqthai', 'tqthai', 'tqthai@gmail.com');