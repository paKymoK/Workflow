CREATE TABLE IF NOT EXISTS department
(
    id          bigserial    NOT NULL,
    name        varchar(200) NOT NULL,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS unit
(
    id            bigserial    NOT NULL,
    name          varchar(200) NOT NULL,
    department_id bigint       NOT NULL REFERENCES department (id),
    created_at    timestamp with time zone,
    created_by    jsonb,
    modified_at   timestamp with time zone,
    modified_by   jsonb,
    PRIMARY KEY (id),
    UNIQUE (department_id, name)
);

CREATE TABLE IF NOT EXISTS employee
(
    sub           varchar(200) NOT NULL,
    name          varchar(200) NOT NULL,
    email         varchar(200),
    avatar_url    varchar(500),
    title         varchar(200),
    department_id bigint REFERENCES department (id),
    unit_id       bigint REFERENCES unit (id),
    work_location varchar(200),
    manager_sub   varchar(200) REFERENCES employee (sub),
    joined_date   date,
    shift         varchar(50) CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT')),
    shift_hours   varchar(100),
    status        varchar(20)  NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')),
    created_at    timestamp with time zone,
    created_by    jsonb,
    modified_at   timestamp with time zone,
    modified_by   jsonb,
    PRIMARY KEY (sub)
);

CREATE INDEX IF NOT EXISTS idx_employee_manager_sub ON employee (manager_sub);
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON employee (department_id);
CREATE INDEX IF NOT EXISTS idx_employee_unit_id ON employee (unit_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employee (status);

CREATE TABLE IF NOT EXISTS employee_personal
(
    sub                     varchar(200) NOT NULL,
    personal_email          varchar(200),
    mobile_phone            varchar(50),
    date_of_birth           date,
    gender                  varchar(20),
    national_id             varchar(50),
    address                 varchar(500),
    emergency_contact_name  varchar(200),
    emergency_contact_phone varchar(50),
    created_at              timestamp with time zone,
    created_by              jsonb,
    modified_at             timestamp with time zone,
    modified_by             jsonb,
    PRIMARY KEY (sub),
    CONSTRAINT fk_employee_personal_employee
        FOREIGN KEY (sub) REFERENCES employee (sub) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_contract
(
    id                 bigserial    NOT NULL,
    sub                varchar(200) NOT NULL REFERENCES employee (sub) ON DELETE CASCADE,
    contract_type      varchar(30)  NOT NULL
        CHECK (contract_type IN ('PROBATION', 'FIXED_TERM', 'INDEFINITE')),
    start_date         date         NOT NULL,
    end_date           date,
    signed_date        date,
    probation_end_date date,
    compensation       numeric(14, 2),
    status             varchar(20)  NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'EXPIRED', 'TERMINATED')),
    document_url       varchar(500),
    created_at         timestamp with time zone,
    created_by         jsonb,
    modified_at        timestamp with time zone,
    modified_by        jsonb,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_employee_contract_sub ON employee_contract (sub);

-- Only one contract can be the "current" one per employee.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_contract_one_active
    ON employee_contract (sub) WHERE status = 'ACTIVE';
