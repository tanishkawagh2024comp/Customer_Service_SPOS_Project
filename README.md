# Customer Service Center - Round Robin Scheduling Simulator

A Spring Boot + SQLite application that models customer queries as processes and allocates
service time to them with **Round Robin scheduling**. Includes a REST API, a vanilla HTML/CSS/JS
frontend (Chart.js bundled, works offline), persistence, and tests.
The full requirements are in [SPEC.md](SPEC.md).

## Requirements

* JDK 17 or newer
* Maven 3.9+ (internet access on the first build to download dependencies)

## Run

```bash
mvn spring-boot:run          # or: mvn clean package && java -jar target/customer-service-round-robin-1.0.0.jar
```

* Application: <http://localhost:8080>
* API documentation (Swagger UI): <http://localhost:8080/swagger-ui.html>
* Database: `./data/customerservice.db` (created automatically, persists across restarts)

**Quick start:** open *Settings* -> **Load sample dataset**, then go to *Scheduler Simulator* and press **Start**
(or **Execute One Step** to go slice by slice).

## Test

```bash
mvn test
```

* `RoundRobinSchedulerTest` - 23 plain JUnit tests of the engine, including the 12 required cases and the
  sample dataset from the specification (avg waiting 8.4, turnaround 12.4, response 3.4, 10 context switches).
* `MetricsServiceTest` - averages, utilization, N/A handling, context-switch convention.
* `SimulationControllerTest` - end-to-end MockMvc tests against a real SQLite file in `target/test-data`.

## Project structure

```
src/main/java/com/example/customerservice
  controller/   REST controllers (Query, Agent, Simulation, Dashboard, Config)
  service/      RoundRobinScheduler (engine), AgentAssignmentService, MetricsService,
                SimulationService, QueryService, AgentService, ConfigService, SampleDataService, DashboardService
  scheduling/   engine domain types (ScheduledQuery, SchedulerState, SchedEvent, StepResult, ...)
  model/        JPA entities + enums      repository/  Spring Data repositories
  dto/          request/response records  exception/   GlobalExceptionHandler + ApiError
src/main/resources/schema.sql       idempotent SQLite schema (tables, foreign keys, CHECK constraints)
src/main/resources/static/          index.html, css/, js/ (api, charts, scheduler, app) and vendored Chart.js
```

## REST API (summary)

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/queries` | list (filters `id,name,category,status`) / create |
| GET/PUT/DELETE | `/api/queries/{id}` | read / update / delete |
| GET/POST | `/api/agents` | list / create |
| GET/PUT/DELETE | `/api/agents/{id}` | read / update / **deactivate** |
| POST | `/api/simulations` | create run (`{"timeQuantum":2}`, optional) |
| GET | `/api/simulations/current`, `/history`, `/{id}`, `/{id}/events`, `/{id}/results` | read state |
| POST | `/api/simulations/{id}/start \| pause \| resume \| step \| reset` | control |
| GET | `/api/simulations/compare?quanta=1,2,4` | what-if quantum comparison (not persisted) |
| GET | `/api/dashboard/summary` | dashboard data |
| GET/PUT | `/api/config` | quantum, playback speed, mode |
| POST | `/api/sample-data?replace=false` | load the sample dataset |

Errors are JSON (`status`, `message`, `fieldErrors`) with 400 / 404 / 409 as appropriate; no stack traces are exposed.

## Key design decisions

* **Single source of truth:** all scheduling is done in `RoundRobinScheduler` on the backend. The frontend only
  displays results and never recomputes them.
* **Deterministic and stateless:** when a run starts, its input is frozen as a JSON snapshot. The engine state after
  *N* steps is rebuilt by replaying *N* steps. Consequences: runs survive restarts, and editing queries/agents
  later can never change a finished run (also required by the spec).
* **Event model:** every executed slice is one event of type `REQUEUE` (query goes back to the queue) or
  `COMPLETION` (query finished); `IDLE` marks clock jumps. `EXECUTION` exists in the enum but is reserved,
  because the spec allows combining execution with requeue/completion.
* **Context switch convention:** counted when a slice serves a different query than the previous slice; the first
  dispatch is not counted. Utilization = execution time / elapsed time (idle time included).
* **Agent assignment:** lowest-ID agent that is active and available. The engine marks it BUSY for the slice and
  releases it right after. If no agent is eligible, the step is *blocked*: the run is paused with an explanatory
  message, the query stays at the head of the queue, and the API answers `409`.
* **Locking:** queries cannot be created/edited/deleted while a run is RUNNING or PAUSED (409).
* **Run lifecycle:** CREATED -> RUNNING <-> PAUSED -> COMPLETED. Creating a new run cancels any unfinished run
  (kept in history). Completed runs cannot be reset; they remain as history.
* **Agents are deactivated, not deleted**, so history keeps referring to them.
* **Timestamps** are stored as ISO-8601 text to avoid SQLite/Hibernate date-mapping pitfalls.

## Known limitations

* The optional arrival-time configuration setting from the specification is not implemented
  (arrival times are set per query).
* Agent skill category is informational; assignment ignores it (as the specification requires).
* Maven wrapper is not included; use an installed Maven.
