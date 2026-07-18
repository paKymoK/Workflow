-- Read-only mirror of employee-service's General record, fed by consuming the
-- employee.events Kafka topic. Used only to populate CustomOAuth2TokenCustomizer's
-- "info" JWT claim, so login doesn't take a live network dependency on
-- employee-service. No admin/write path — auth-service is not the source of truth
-- for this data anymore, employee-service is.
CREATE TABLE IF NOT EXISTS employee_mirror
(
    sub        varchar(200) NOT NULL,
    name       varchar(200),
    email      varchar(200),
    title      varchar(200),
    department varchar(200),
    avatar     varchar(500),
    PRIMARY KEY (sub)
);
