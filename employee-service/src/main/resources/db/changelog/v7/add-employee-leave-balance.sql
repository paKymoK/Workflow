-- Per-employee, per-leave-type, per-year balance. Rows are created lazily (see
-- EmployeeLeaveBalanceServiceImpl) with a default totalDays the first time a balance is read or
-- incremented for a given sub/type/year, rather than bulk-seeded here — there's no reliable
-- "every current employee" list to iterate over from a raw SQL migration.

CREATE TABLE IF NOT EXISTS employee_leave_balance
(
    id          bigserial    NOT NULL,
    sub         varchar(200) NOT NULL REFERENCES employee (sub),
    leave_type  varchar(20)  NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'PERSONAL', 'UNPAID', 'MATERNITY')),
    year        integer      NOT NULL,
    total_days  integer      NOT NULL,
    used_days   integer      NOT NULL DEFAULT 0,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    UNIQUE (sub, leave_type, year)
);
