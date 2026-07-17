CREATE TABLE IF NOT EXISTS employee
(
    id             bigserial                NOT NULL,
    sub            varchar(200)             NOT NULL,
    employee_code  varchar(50)              NOT NULL,
    name           varchar(200)             NOT NULL,
    email          varchar(200),
    mobile_phone   varchar(50),
    avatar_url     varchar(500),
    title          varchar(200),
    department     varchar(200),
    line           varchar(200),
    work_location  varchar(200),
    manager_id     bigint                   REFERENCES employee (id),
    joined_date    date,
    shift          varchar(50),
    shift_hours    varchar(100),
    status         varchar(20)              NOT NULL DEFAULT 'ACTIVE',
    created_at     timestamp with time zone,
    created_by     jsonb,
    modified_at    timestamp with time zone,
    modified_by    jsonb,
    PRIMARY KEY (id),
    UNIQUE (sub),
    UNIQUE (employee_code)
);

CREATE INDEX IF NOT EXISTS idx_employee_manager_id ON employee (manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_department ON employee (department);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employee (status);
