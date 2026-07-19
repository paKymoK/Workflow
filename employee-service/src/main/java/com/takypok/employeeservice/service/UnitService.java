// Superseded by Phase 7: unit CRUD moved to auth-service. Employee-service's Unit table is now a
// read-only Kafka mirror (see config/UnitEventConsumer), with no service-layer write path of its
// own — EmployeeServiceImpl reads UnitRepository directly for its unitName enrichment join.
// Stubbed rather than deleted (the environment this was authored in couldn't run `rm`) — no
// longer referenced anywhere in the codebase.
