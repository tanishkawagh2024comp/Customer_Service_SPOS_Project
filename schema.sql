-- Customer Service Center - SQLite schema. Every statement is idempotent (IF NOT EXISTS),
-- so the application can be restarted and the data persists in ./data/customerservice.db.

CREATE TABLE IF NOT EXISTS customer_query (
    id               INTEGER PRIMARY KEY,
    customer_name    TEXT    NOT NULL,
    customer_email   TEXT    NOT NULL,
    category         TEXT    NOT NULL,
    description      TEXT    NOT NULL,
    arrival_time     INTEGER NOT NULL CHECK (arrival_time >= 0),
    burst_time       INTEGER NOT NULL CHECK (burst_time > 0),
    remaining_time   INTEGER NOT NULL,
    status           TEXT    NOT NULL,
    creation_sequence INTEGER NOT NULL,
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL,
    CHECK (remaining_time >= 0 AND remaining_time <= burst_time)
);

CREATE TABLE IF NOT EXISTS service_agent (
    id             INTEGER PRIMARY KEY,
    name           TEXT    NOT NULL,
    email          TEXT    NOT NULL UNIQUE,
    skill_category TEXT,
    active         INTEGER NOT NULL CHECK (active IN (0, 1)),
    created_at     TEXT    NOT NULL,
    updated_at     TEXT    NOT NULL
);

-- snapshot_json freezes the scheduling input when a run starts, so editing queries or agents
-- later never changes the history of a finished run.
CREATE TABLE IF NOT EXISTS simulation_run (
    id                 INTEGER PRIMARY KEY,
    time_quantum       INTEGER NOT NULL CHECK (time_quantum > 0),
    status             TEXT    NOT NULL,
    simulated_time     INTEGER NOT NULL DEFAULT 0,
    total_queries      INTEGER NOT NULL DEFAULT 0,
    completed_queries  INTEGER NOT NULL DEFAULT 0,
    steps_executed     INTEGER NOT NULL DEFAULT 0,
    snapshot_json      TEXT,
    message            TEXT,
    context_switches   INTEGER NOT NULL DEFAULT 0,
    busy_time          INTEGER NOT NULL DEFAULT 0,
    avg_waiting_time    REAL,
    avg_turnaround_time REAL,
    avg_response_time   REAL,
    utilization         REAL,
    created_at         TEXT    NOT NULL,
    finished_at        TEXT
);

-- query_id and agent_id are intentionally plain numbers (no foreign key): history must survive
-- later deletion or editing of queries and agents.
CREATE TABLE IF NOT EXISTS scheduling_event (
    id                             INTEGER PRIMARY KEY,
    simulation_run_id              INTEGER NOT NULL REFERENCES simulation_run (id) ON DELETE CASCADE,
    query_id                       INTEGER,
    agent_id                       INTEGER,
    event_type                     TEXT    NOT NULL,
    start_time                     INTEGER NOT NULL CHECK (start_time >= 0),
    end_time                       INTEGER NOT NULL,
    allocated_duration             INTEGER NOT NULL CHECK (allocated_duration >= 0),
    remaining_time_after_execution INTEGER,
    CHECK (end_time >= start_time)
);

CREATE TABLE IF NOT EXISTS query_execution_result (
    id                INTEGER PRIMARY KEY,
    simulation_run_id INTEGER NOT NULL REFERENCES simulation_run (id) ON DELETE CASCADE,
    query_id          INTEGER NOT NULL,
    customer_name     TEXT,
    arrival_time      INTEGER NOT NULL,
    burst_time        INTEGER NOT NULL,
    first_start_time  INTEGER NOT NULL,
    completion_time   INTEGER NOT NULL,
    waiting_time      INTEGER NOT NULL CHECK (waiting_time >= 0),
    turnaround_time   INTEGER NOT NULL,
    response_time     INTEGER NOT NULL CHECK (response_time >= 0)
);

CREATE TABLE IF NOT EXISTS app_setting (
    setting_key   TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_run ON scheduling_event (simulation_run_id);
CREATE INDEX IF NOT EXISTS idx_result_run ON query_execution_result (simulation_run_id);
