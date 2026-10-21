*\# Customer Service Center*

*\## Round Robin Scheduling-Based Query Allocation System*

*Version: 1.0*

*Project Domain: System Programming and Operating Systems*

*Primary Algorithm: Round Robin CPU Scheduling*

*Implementation Language: Java 17+*

*Application Type: Full-stack web application*

*Database: SQLite*

*Frontend: HTML, CSS, JavaScript*

*Backend: Java Spring Boot*

*Build Tool: Maven*

*\# 1. PROJECT OVERVIEW*

*\## 1.1 Project Title*

*Customer Service Center: A Round Robin Scheduling-Based Query*

*Allocation System for an E-Commerce Website.*

*\## 1.2 Problem Statement*

*Design and develop a system that applies the Round Robin scheduling*

*algorithm to manage the allocation of customer queries to available*

*agents in a customer service center for an e-commerce website.*

*The system should ensure that each customer query is served in turn,*

*with an equal time quantum given during each scheduling cycle.*

*The objective is to demonstrate fair query handling, reduce excessive*

*waiting, prevent starvation, and improve resource utilization so that*

*no available agent remains unnecessarily idle while queries are
waiting.*

*The application should provide a graphical dashboard for managing*

*customer queries, configuring agents and time quantum, executing the*

*scheduling simulation, and analyzing performance metrics.*

*\## 1.3 Project Objectives*

*1. Implement the Round Robin scheduling algorithm.*

*2. Model customer queries as schedulable processes.*

*3. Model customer service agents as service resources.*

*4. Maintain a FIFO ready queue for pending queries.*

*5. Allocate a configurable time quantum to each query.*

*6. Preempt unfinished queries and move them to the end of the ready
queue.*

*7. Track arrival time, burst time, remaining time, completion time,*

* waiting time, and turnaround time.*

*8. Display scheduling activity through a visual Gantt chart.*

*9. Show the status of each customer query and service agent.*

*10. Calculate scheduling and service performance metrics.*

*11. Persist query, agent, and simulation history in a database.*

*12. Provide an interactive interface for running and analyzing
simulations.*

*13. Include automated tests for the scheduling algorithm.*

*14. Demonstrate the working of a fundamental Operating Systems concept*

* through a practical customer service scenario.*

*\# 2. IMPORTANT SCHEDULING DESIGN*

*Round Robin is traditionally a preemptive CPU scheduling algorithm.*

*In this project:*

*- Each customer query is treated as a process.*

*- The estimated handling duration of a query is its burst time.*

*- The configured time quantum determines the maximum processing*

* time allocated to a query during one scheduling turn.*

*- The ready queue contains queries waiting for service.*

*- An unfinished query is returned to the end of the ready queue.*

*- A completed query is removed from the scheduling system.*

*- Service agents are modeled as available resources.*

*The application is an educational scheduling simulator. It does not*

*need to connect to a real e-commerce platform or execute actual*

*customer conversations.*

*\## 2.1 Scheduling Semantics*

*Implement a deterministic, event-driven scheduling simulation.*

*Use a single logical scheduling timeline to demonstrate standard*

*Round Robin behavior.*

*For the core simulation, model the available service capacity as one*

*shared scheduling resource. The configured agent pool represents*

*the customer service team, and agent assignment is tracked separately.*

*Each scheduling slice is assigned to an eligible service agent using*

*a deterministic agent-selection policy.*

*For simplicity, choose the available agent with the lowest agent ID,*

*breaking ties by ID.*

*The simulation is sequential and represents logical service
allocation.*

*It must not claim that multiple queries are being processed in
parallel.*

*This design ensures that the classic Round Robin algorithm remains*

*correct and its scheduling metrics are mathematically consistent.*

*The UI should clearly explain that the simulation represents fair*

*allocation of service time rather than real concurrent call-center*

*execution.*

*\## 2.2 Scheduling Rules*

*1. Queries are ordered by arrival time.*

*2. Queries with identical arrival times are ordered by creation
sequence.*

*3. A query becomes eligible for scheduling when its arrival time is*

* less than or equal to the current simulation time.*

*4. The scheduler selects the query at the front of the ready queue.*

*5. The query receives a time slice equal to:*

* min(time quantum, remaining burst time)*

*6. During execution, the simulation clock advances by the actual
slice.*

*7. Queries arriving during the slice become eligible at the end of*

* that slice.*

*8. If a query finishes, mark it completed.*

*9. If a query does not finish, return it to the end of the ready
queue.*

*10. If no query is ready, advance the simulation clock to the next*

* query arrival time.*

*11. If all queries are complete, stop the simulation.*

*12. Never discard a query or allow its remaining time to become
negative.*

*Use integer time units for the initial implementation.*

*The interface may label these units as simulated service minutes.*

*\# 3. TECHNOLOGY STACK*

*Use the following technologies.*

*\## Backend*

*- Java 17 or newer*

*- Spring Boot*

*- Spring Web*

*- Spring Data JPA*

*- Hibernate*

*- Bean Validation*

*- Maven*

*\## Database*

*- SQLite*

*- SQLite JDBC driver*

*- Hibernate-compatible SQLite dialect*

*If the selected Hibernate version does not support SQLite without*

*additional configuration, use a compatible community dialect or*

*implement a small repository layer with JDBC.*

*Do not silently replace SQLite with an unrelated database.*

*\## Frontend*

*- HTML5*

*- CSS3*

*- Vanilla JavaScript*

*- Fetch API*

*- Chart.js for charts*

*- A lightweight JavaScript Gantt-chart implementation or a custom*

* timeline rendered with HTML/CSS*

*Avoid unnecessary frontend frameworks.*

*\## Testing*

*- JUnit 5*

*- Spring Boot Test*

*- MockMvc for API tests where appropriate*

*\## Development Environment*

*The project should work on Windows, Linux, and macOS.*

*It should be runnable from the terminal using Maven.*

*No paid services, external APIs, or cloud infrastructure should be*

*required.*

*\# 4. APPLICATION FEATURES*

*\## 4.1 Dashboard*

*Create a modern dashboard showing the current system state.*

*Display the following summary cards:*

*- Total customer queries*

*- Waiting queries*

*- Currently executing query*

*- Completed queries*

*- Available agents*

*- Total agents*

*- Average waiting time*

*- Average turnaround time*

*- CPU/resource utilization*

*- Total context switches*

*The dashboard should contain:*

*1. A query status distribution chart.*

*2. A Round Robin Gantt chart.*

*3. An agent availability panel.*

*4. A ready queue visualization.*

*5. A recent scheduling activity table.*

*6. A simulation control panel.*

*Use a clean, professional interface suitable for a college project*

*demonstration.*

*Use a consistent color system:*

*- Waiting: amber*

*- Running: blue*

*- Completed: green*

*- Idle: gray*

*- Error: red*

*Include readable labels and a responsive layout.*

*\## 4.2 Customer Query Management*

*Allow users to create, view, edit, and delete customer queries.*

*Each query must have the following fields:*

*- Query ID: automatically generated*

*- Customer name*

*- Customer email*

*- Query category*

*- Query description*

*- Arrival time*

*- Estimated handling time (burst time)*

*- Remaining time*

*- Status*

*- Creation sequence*

*Supported query categories:*

*- Order Tracking*

*- Payment Issue*

*- Return and Refund*

*- Product Inquiry*

*- Delivery Delay*

*- Account Issue*

*- Other*

*Supported query statuses:*

*- NEW*

*- WAITING*

*- RUNNING*

*- COMPLETED*

*- CANCELLED*

*Validation rules:*

*- Customer name is required.*

*- Customer email must be valid.*

*- Query category is required.*

*- Query description is required.*

*- Arrival time must be non-negative.*

*- Burst time must be a positive integer.*

*- Remaining time must never exceed the original burst time.*

*- Completed queries cannot be scheduled again unless the simulation*

* is explicitly reset.*

*- A query being processed by a simulation cannot be deleted without*

* resetting or cancelling that simulation.*

*Provide search and filtering by:*

*- Query ID*

*- Customer name*

*- Category*

*- Status*

*\## 4.3 Agent Management*

*Allow the user to add, view, edit, and deactivate service agents.*

*Each agent should have:*

*- Agent ID*

*- Agent name*

*- Email*

*- Skill category*

*- Active status*

*- Current status*

*- Number of assigned scheduling slices*

*- Total simulated service time*

*Supported agent statuses:*

*- AVAILABLE*

*- BUSY*

*- OFFLINE*

*Rules:*

*1. Only active agents can receive assignments.*

*2. An offline agent cannot receive new assignments.*

*3. Agent IDs must be unique.*

*4. An agent must not be assigned two queries simultaneously.*

*5. The agent-selection policy must be deterministic.*

*6. If no eligible agent exists, the scheduler must pause and explain*

* why it cannot allocate the next slice.*

*7. The UI must distinguish agent availability from query status.*

*For the initial version, agents may support all query categories.*

*Skill-based routing may be added as an optional extension, but it*

*must not change the default Round Robin behavior.*

*\## 4.4 Scheduling Configuration*

*Provide a settings panel containing:*

*- Time quantum*

*- Number of agents*

*- Simulation speed*

*- Scheduling mode*

*- Optional arrival-time configuration*

*Time quantum must be a positive integer.*

*Provide preset quantum values:*

*- 1*

*- 2*

*- 4*

*- 5*

*- 10*

*Allow a custom positive integer.*

*The initial scheduling mode must be:*

*ROUND_ROBIN*

*Do not add priority scheduling or shortest-job-first as alternative*

*default algorithms.*

*The purpose of the project is to demonstrate Round Robin clearly.*

*\## 4.5 Simulation Controls*

*Provide the following controls:*

*- Start Simulation*

*- Pause Simulation*

*- Resume Simulation*

*- Execute One Scheduling Step*

*- Reset Simulation*

*- Load Sample Dataset*

*Expected behavior:*

*\### Start Simulation*

*Initialize the ready queue, reset the simulation clock, and begin*

*processing eligible queries.*

*\### Pause Simulation*

*Pause the visualization without changing query progress.*

*\### Resume Simulation*

*Continue from the current simulation state.*

*\### Execute One Scheduling Step*

*Execute exactly one scheduling slice or one idle-time advancement*

*when no query is ready.*

*Display:*

*- Selected query*

*- Assigned agent*

*- Remaining time before execution*

*- Time quantum*

*- Actual slice duration*

*- Remaining time after execution*

*- Whether the query completed or was requeued*

*\### Reset Simulation*

*Restore the selected dataset to its initial scheduling state.*

*Do not delete customer records or agent records when resetting*

*a simulation.*

*\### Load Sample Dataset*

*Load a reproducible example dataset for demonstrations.*

*Prevent accidental duplicate insertion of sample records.*

*Use a confirmation dialog before destructive actions.*

*\# 5. ROUND ROBIN ALGORITHM IMPLEMENTATION*

*Implement the algorithm in a dedicated Java service class.*

*Suggested class:*

*RoundRobinScheduler.java*

*Do not implement the scheduling algorithm inside a controller*

*or directly in frontend JavaScript.*

*The backend must be the source of truth for scheduling results.*

*\## 5.1 Data Model*

*Each schedulable query should have:*

*- id*

*- arrivalTime*

*- burstTime*

*- remainingTime*

*- completionTime*

*- waitingTime*

*- turnaroundTime*

*- firstStartTime*

*- status*

*- creationSequence*

*Each scheduling event should contain:*

*- eventId*

*- queryId*

*- agentId*

*- startTime*

*- endTime*

*- allocatedDuration*

*- remainingTimeAfterExecution*

*- eventType*

*Possible event types:*

*- EXECUTION*

*- IDLE*

*- COMPLETION*

*- REQUEUE*

*The event model may combine completion and execution information*

*when appropriate, but the timeline must remain unambiguous.*

*\## 5.2 Pseudocode*

*function runRoundRobin(queries, quantum, agents):*

* validate quantum \> 0*

* validate queries have valid arrival and burst times*

* validate at least one eligible agent exists*

* sort queries by arrivalTime, then creationSequence*

* readyQueue = empty FIFO queue*

* currentTime = 0*

* completedCount = 0*

* nextQueryIndex = 0*

* while completedCount \< totalQueries:*

* while nextQueryIndex \< totalQueries*

* and queries\[nextQueryIndex\].arrivalTime \<= currentTime:*

* readyQueue.enqueue(queries\[nextQueryIndex\])*

* mark query WAITING*

* nextQueryIndex++*

* if readyQueue is empty:*

* if nextQueryIndex \< totalQueries:*

* nextArrival = queries\[nextQueryIndex\].arrivalTime*

* record idle interval from currentTime to nextArrival*

* currentTime = nextArrival*

* continue*

* else:*

* break*

* currentQuery = readyQueue.dequeue()*

* mark currentQuery RUNNING*

* if currentQuery.firstStartTime is not set:*

* currentQuery.firstStartTime = currentTime*

* agent = selectAvailableAgent(agents)*

* if no eligible agent exists:*

* pause the simulation and report the condition*

* do not discard the dequeued query*

* stop or suspend safely*

* sliceDuration = min(*

* quantum,*

* currentQuery.remainingTime*

* )*

* sliceStart = currentTime*

* sliceEnd = currentTime + sliceDuration*

* record execution event*

* currentQuery.remainingTime -= sliceDuration*

* currentTime = sliceEnd*

* while nextQueryIndex \< totalQueries*

* and queries\[nextQueryIndex\].arrivalTime \<= currentTime:*

* readyQueue.enqueue(queries\[nextQueryIndex\])*

* mark query WAITING*

* nextQueryIndex++*

* if currentQuery.remainingTime == 0:*

* currentQuery.completionTime = currentTime*

* currentQuery.turnaroundTime =*

* currentQuery.completionTime -*

* currentQuery.arrivalTime*

* currentQuery.waitingTime =*

* currentQuery.turnaroundTime -*

* currentQuery.burstTime*

* mark currentQuery COMPLETED*

* completedCount++*

* else:*

* mark currentQuery WAITING*

* readyQueue.enqueue(currentQuery)*

* return scheduling results and events*

*\## 5.3 Important Implementation Rules*

*1. Use a FIFO queue for Round Robin scheduling.*

*2. Use a deterministic arrival-time ordering.*

*3. Maintain remaining burst time for every query.*

*4. Do not reset remaining time after a time slice.*

*5. Use the actual slice duration when updating simulation time.*

*6. Process newly arrived queries before requeuing an unfinished query.*

*7. Record each execution interval for the Gantt chart.*

*8. Calculate metrics only from valid scheduling results.*

*9. Handle an empty query list.*

*10. Handle simultaneous query arrivals.*

*11. Handle burst times smaller than the quantum.*

*12. Handle burst times exactly equal to the quantum.*

*13. Handle a quantum of 1.*

*14. Handle a query arriving after a long idle period.*

*15. Avoid infinite loops.*

*16. Never use Thread.sleep() to calculate scheduling metrics.*

*17. Separate simulated time from wall-clock time.*

*18. Keep the algorithm deterministic for identical inputs.*

*The simulation speed must only control the animation or execution*

*playback speed. It must not change the scheduling outcome.*

*\# 6. AGENT ASSIGNMENT LOGIC*

*Implement agent assignment in a separate service.*

*Suggested class:*

*AgentAssignmentService.java*

*For the initial implementation, use the following policy:*

*- Select an active agent whose status is AVAILABLE.*

*- If multiple agents are available, choose the agent with the*

* lowest agent ID.*

*- Mark the selected agent BUSY during the simulated execution slice.*

*- Mark the agent AVAILABLE after the slice completes.*

*- Record the assignment against the query and scheduling event.*

*Because the core simulation uses a single logical scheduling resource,*

*only one agent is BUSY during a scheduling slice.*

*The remaining agents should remain AVAILABLE.*

*The scheduler must never assign a query to an inactive or offline
agent.*

*If every agent is offline or inactive, the simulation must not*

*continue silently. Display a clear error message.*

*Do not pretend that a sequential simulation provides simultaneous*

*multi-agent execution.*

*If true concurrent service-agent simulation is implemented in a*

*future version, treat it as a separate scheduling model with its*

*own metrics and tests.*

*\# 7. PERFORMANCE METRICS*

*Calculate the following metrics.*

*\## 7.1 Completion Time*

*Completion time is the simulation time at which a query finishes.*

*\## 7.2 Turnaround Time*

*Turnaround time is the total time from query arrival to completion.*

*Formula:*

*Turnaround Time = Completion Time - Arrival Time*

*\## 7.3 Waiting Time*

*Waiting time is the total time a query spends waiting in the ready*

*queue.*

*For a query that executes without interruption and has no arrival
delay:*

*Waiting Time = Turnaround Time - Burst Time*

*For the standard Round Robin model:*

*Waiting Time = Turnaround Time - Burst Time*

*The formula assumes that burst time represents all required*

*service time and that the query is not blocked for other reasons.*

*\## 7.4 Response Time*

*Response time is the time between query arrival and its first*

*execution.*

*Formula:*

*Response Time = First Start Time - Arrival Time*

*\## 7.5 Average Waiting Time*

*Average Waiting Time =*

* Sum of completed query waiting times / Number of completed queries*

*\## 7.6 Average Turnaround Time*

*Average Turnaround Time =*

* Sum of completed query turnaround times / Number of completed queries*

*\## 7.7 Average Response Time*

*Average Response Time =*

* Sum of completed query response times / Number of completed queries*

*If no queries have completed, display N/A rather than dividing by
zero.*

*\## 7.8 Context Switches*

*For this educational simulation, count a context switch whenever*

*execution moves from one query to a different query after a slice.*

*Do not count the first query dispatch as a context switch.*

*Document the counting convention in the UI.*

*\## 7.9 Resource Utilization*

*For the single logical scheduling resource:*

*Utilization (%) =*

* Total execution time / Total elapsed simulation time \* 100*

*If elapsed simulation time is zero, display N/A.*

*Report the simulation resource utilization separately from the*

*availability of the physical agent pool.*

*Do not label the sequential simulation's resource utilization as*

*real-world multi-agent utilization.*

*\# 8. GANTT CHART*

*Implement a visual scheduling timeline.*

*Each execution segment should display:*

*- Query ID*

*- Agent ID*

*- Start time*

*- End time*

*- Slice duration*

*- Remaining time after the slice*

*Idle periods must be represented explicitly.*

*Example:*

*\| Query \| Start \| End \| Duration \|*

*\|-------\|-------\|-----\|----------\|*

*\| Q1 \| 0 \| 2 \| 2 \|*

*\| Q2 \| 2 \| 4 \| 2 \|*

*\| Q1 \| 4 \| 6 \| 2 \|*

*\| Q3 \| 6 \| 7 \| 1 \|*

*The example is illustrative only.*

*Use distinct colors for different queries.*

*Hovering over a segment should reveal its scheduling details.*

*The timeline must use actual event data returned by the backend.*

*Do not hardcode the Gantt chart.*

*\# 9. DATABASE DESIGN*

*Use SQLite to persist application data.*

*Create the following tables.*

*\## 9.1 CustomerQuery*

*Fields:*

*- id: primary key*

*- customerName*

*- customerEmail*

*- category*

*- description*

*- arrivalTime*

*- burstTime*

*- creationSequence*

*- createdAt*

*- updatedAt*

*\## 9.2 ServiceAgent*

*Fields:*

*- id: primary key*

*- name*

*- email*

*- skillCategory*

*- active*

*- createdAt*

*- updatedAt*

*\## 9.3 SimulationRun*

*Fields:*

*- id: primary key*

*- timeQuantum*

*- status*

*- simulatedTime*

*- totalQueries*

*- completedQueries*

*- createdAt*

*- finishedAt*

*\## 9.4 SchedulingEvent*

*Fields:*

*- id: primary key*

*- simulationRunId: foreign key*

*- queryId*

*- agentId*

*- eventType*

*- startTime*

*- endTime*

*- allocatedDuration*

*- remainingTimeAfterExecution*

*\## 9.5 QueryExecutionResult*

*Fields:*

*- id: primary key*

*- simulationRunId: foreign key*

*- queryId*

*- firstStartTime*

*- completionTime*

*- waitingTime*

*- turnaroundTime*

*- responseTime*

*Use proper foreign keys and database constraints where applicable.*

*A completed simulation should preserve its results even if a later*

*simulation is started.*

*Resetting a simulation must not erase historical runs.*

*If query and agent configuration is edited after a run finishes,*

*historical results must remain unchanged.*

*The application should use database transactions when saving a*

*completed simulation.*

*\# 10. REST API DESIGN*

*Use a base path:*

*/api*

*\## Query APIs*

*GET /api/queries*

*Return all queries.*

*GET /api/queries/{id}*

*Return a specific query.*

*POST /api/queries*

*Create a query.*

*PUT /api/queries/{id}*

*Update a query.*

*DELETE /api/queries/{id}*

*Delete a query when allowed.*

*GET /api/queries?status=WAITING*

*Filter by status.*

*GET /api/queries?category=PAYMENT_ISSUE*

*Filter by category.*

*\## Agent APIs*

*GET /api/agents*

*Return all agents.*

*GET /api/agents/{id}*

*Return a specific agent.*

*POST /api/agents*

*Create an agent.*

*PUT /api/agents/{id}*

*Update an agent.*

*DELETE /api/agents/{id}*

*Deactivate or delete an agent when safe.*

*\## Simulation APIs*

*POST /api/simulations*

*Create a new simulation.*

*POST /api/simulations/{id}/start*

*Start the simulation.*

*POST /api/simulations/{id}/pause*

*Pause the simulation.*

*POST /api/simulations/{id}/resume*

*Resume the simulation.*

*POST /api/simulations/{id}/step*

*Execute one scheduling step.*

*POST /api/simulations/{id}/reset*

*Reset the current simulation state.*

*GET /api/simulations/{id}*

*Retrieve the simulation state.*

*GET /api/simulations/{id}/events*

*Retrieve scheduling events.*

*GET /api/simulations/{id}/results*

*Retrieve completed query metrics.*

*GET /api/simulations/history*

*Retrieve historical simulation runs.*

*\## Configuration API*

*GET /api/config*

*Return the current configuration.*

*PUT /api/config*

*Update allowed scheduling configuration.*

*\## Dashboard API*

*GET /api/dashboard/summary*

*Return the dashboard summary, agent states, query counts,*

*and scheduling metrics.*

*\## API Requirements*

*- Return correct HTTP status codes.*

*- Validate request payloads.*

*- Return structured JSON errors.*

*- Use appropriate 400, 404, and 409 responses.*

*- Avoid exposing Java stack traces to users.*

*- Document the API using Springdoc OpenAPI if practical.*

*- Prevent invalid transitions between simulation states.*

*\# 11. FRONTEND PAGES*

*Implement the following pages or navigation sections.*

*\## 11.1 Dashboard*

*Show summary metrics, agent states, ready queue, charts, and*

*recent scheduling events.*

*\## 11.2 Customer Queries*

*Show a searchable and filterable table.*

*Provide an Add Query form.*

*Allow viewing and editing query details.*

*\## 11.3 Service Agents*

*Show the agent list and status.*

*Provide an Add Agent form.*

*Allow activating, deactivating, and editing agents.*

*\## 11.4 Scheduler Simulator*

*This is the primary project demonstration page.*

*Show:*

*- Time quantum configuration*

*- Simulation time*

*- Ready queue*

*- Currently running query*

*- Assigned agent*

*- Remaining time for every query*

*- Start, pause, resume, step, and reset controls*

*- Gantt chart*

*- Event log*

*- Completion statistics*

*When a step is executed, visually highlight the selected query.*

*When a query is requeued, animate its movement to the back of the*

*ready queue.*

*When a query completes, show its completion status.*

*\## 11.5 Performance Analysis*

*Display:*

*- Average waiting time*

*- Average turnaround time*

*- Average response time*

*- Resource utilization*

*- Context switches*

*- Query completion count*

*- Individual query metrics*

*- Comparison of different time quantum values*

*For the comparison feature, run independent simulations against*

*the same dataset with different quantum values.*

*Do not modify the original simulation history.*

*Display a comparison table and charts.*

*Explain that Round Robin performance depends on the time quantum.*

*A very small quantum may increase context switches.*

*A very large quantum may make Round Robin behave similarly to*

*First-Come, First-Served scheduling for many workloads.*

*\# 12. SAMPLE DATASET*

*Provide a built-in sample dataset.*

*Use a time quantum of 2.*

*Use three active agents:*

*Agent A: ID 1*

*Agent B: ID 2*

*Agent C: ID 3*

*Create these queries:*

*\| Query ID \| Customer \| Arrival Time \| Burst Time \|*

*\|----------\|----------\|--------------\|------------\|*

*\| Q1 \| Customer A \| 0 \| 5 \|*

*\| Q2 \| Customer B \| 0 \| 4 \|*

*\| Q3 \| Customer C \| 1 \| 2 \|*

*\| Q4 \| Customer D \| 3 \| 6 \|*

*\| Q5 \| Customer E \| 5 \| 3 \|*

*Use the dataset to demonstrate:*

*- Multiple queries arriving at the same time*

*- A query arriving during another query's execution*

*- Requeuing*

*- Query completion*

*- Different burst times*

*- Waiting time calculation*

*- Turnaround time calculation*

*- Response time calculation*

*- Agent assignment*

*- Gantt chart generation*

*The sample dataset must produce deterministic results.*

*\# 13. VALIDATION AND ERROR HANDLING*

*Handle the following cases gracefully:*

*1. No customer queries exist.*

*2. No agents exist.*

*3. All agents are inactive.*

*4. The time quantum is zero.*

*5. The time quantum is negative.*

*6. Burst time is zero.*

*7. Arrival time is negative.*

*8. Invalid customer email.*

*9. Duplicate agent email, if email uniqueness is enabled.*

*10. Query not found.*

*11. Agent not found.*

*12. Invalid simulation ID.*

*13. Starting a completed simulation.*

*14. Pausing an already paused simulation.*

*15. Resuming a simulation that has not been paused.*

*16. Stepping a completed simulation.*

*17. Resetting an unknown simulation.*

*18. Editing queries while a simulation is running.*

*19. Database connection failure.*

*20. Duplicate sample-data loading.*

*Display understandable error messages in the frontend.*

*Log technical details on the backend without exposing stack traces*

*to the user.*

*\# 14. TESTING REQUIREMENTS*

*Write unit tests for RoundRobinScheduler.*

*At minimum, test the following cases.*

*\## Test 1: Single Query*

*Arrival time = 0*

*Burst time = 5*

*Quantum = 2*

*Expected:*

*The query completes at time 5.*

*Waiting time = 0.*

*Turnaround time = 5.*

*Response time = 0.*

*\## Test 2: Two Queries*

*Q1: Arrival = 0, Burst = 5*

*Q2: Arrival = 0, Burst = 3*

*Quantum = 2*

*Expected execution sequence:*

*Q1: 0-2*

*Q2: 2-4*

*Q1: 4-6*

*Q2: 6-7*

*Q1: 7-8*

*Expected final metrics:*

*Q1:*

*Completion = 8*

*Turnaround = 8*

*Waiting = 3*

*Response = 0*

*Q2:*

*Completion = 7*

*Turnaround = 7*

*Waiting = 4*

*Response = 2*

*\## Test 3: Query Arriving Later*

*Q1: Arrival = 0, Burst = 2*

*Q2: Arrival = 5, Burst = 1*

*Quantum = 2*

*Expected:*

*Q1 executes from 0 to 2.*

*The system is idle from 2 to 5.*

*Q2 executes from 5 to 6.*

*\## Test 4: Burst Smaller Than Quantum*

*Q1: Arrival = 0, Burst = 1*

*Quantum = 4*

*Expected:*

*Q1 completes at time 1.*

*The scheduler must not allocate four units of execution.*

*\## Test 5: Burst Exactly Equal to Quantum*

*Q1: Arrival = 0, Burst = 2*

*Quantum = 2*

*Expected:*

*Q1 completes at time 2.*

*The query must not be requeued after completion.*

*\## Test 6: Simultaneous Arrivals*

*Q1, Q2, and Q3 all arrive at time 0.*

*All burst times are 2.*

*Quantum = 1.*

*Expected:*

*The queries are initially scheduled in creation-sequence order.*

*\## Test 7: Empty Dataset*

*Expected:*

*The scheduler returns a valid empty result without crashing.*

*\## Test 8: Invalid Quantum*

*Quantum = 0.*

*Expected:*

*Validation rejects the simulation.*

*\## Test 9: Metric Invariants*

*For every completed query:*

*Turnaround time = Completion time - Arrival time.*

*Waiting time = Turnaround time - Burst time.*

*Response time = First start time - Arrival time.*

*Waiting time must be non-negative.*

*Response time must be non-negative.*

*Completion time must be greater than or equal to first start time.*

*\## Test 10: Remaining Time Invariant*

*For every query:*

*0 \<= remainingTime \<= burstTime.*

*A completed query must have remainingTime = 0.*

*\## Test 11: No Starvation*

*Under finite workload and a positive time quantum, every query*

*that is eligible for scheduling must eventually complete, provided*

*the simulation has at least one eligible service resource.*

*\## Test 12: Agent Assignment*

*Verify that:*

*- Only active agents receive assignments.*

*- No query slice is assigned to an offline agent.*

*- Every execution event references a valid agent.*

*- The selected agent is released after a scheduling slice.*

*\## Integration Tests*

*Test:*

*- Query creation and retrieval.*

*- Agent creation and retrieval.*

*- Simulation creation.*

*- Starting a simulation.*

*- Executing one step.*

*- Retrieving scheduling events.*

*- Retrieving final metrics.*

*- Saving and retrieving simulation history.*

*All tests must run using Maven.*

*\# 15. NON-FUNCTIONAL REQUIREMENTS*

*The application should:*

*- Use a layered backend architecture.*

*- Separate business logic from HTTP controllers.*

*- Separate scheduling logic from persistence.*

*- Use readable and maintainable Java code.*

*- Follow standard Java naming conventions.*

*- Validate input at API boundaries.*

*- Avoid duplicated scheduling logic.*

*- Provide useful error messages.*

*- Use responsive frontend layouts.*

*- Avoid unnecessary external dependencies.*

*- Include comments explaining the Round Robin algorithm.*

*- Include a README with setup instructions.*

*- Run locally without paid services.*

*- Persist data across application restarts.*

*\# 16. SUGGESTED PROJECT STRUCTURE*

*customer-service-round-robin/*

*\|*

*\|-- pom.xml*

*\|-- README.md*

*\|-- SPEC.md*

*\|-- .gitignore*

*\|*

*\|-- src/*

*\| \|-- main/*

*\| \| \|-- java/*

*\| \| \| \|-- com/example/customerservice/*

*\| \| \| \|-- CustomerServiceApplication.java*

*\| \| \| \|*

*\| \| \| \|-- controller/*

*\| \| \| \| \|-- QueryController.java*

*\| \| \| \| \|-- AgentController.java*

*\| \| \| \| \|-- SimulationController.java*

*\| \| \| \| \|-- DashboardController.java*

*\| \| \| \|*

*\| \| \| \|-- service/*

*\| \| \| \| \|-- QueryService.java*

*\| \| \| \| \|-- AgentService.java*

*\| \| \| \| \|-- SimulationService.java*

*\| \| \| \| \|-- RoundRobinScheduler.java*

*\| \| \| \| \|-- AgentAssignmentService.java*

*\| \| \| \| \|-- MetricsService.java*

*\| \| \| \|*

*\| \| \| \|-- model/*

*\| \| \| \| \|-- CustomerQuery.java*

*\| \| \| \| \|-- ServiceAgent.java*

*\| \| \| \| \|-- SimulationRun.java*

*\| \| \| \| \|-- SchedulingEvent.java*

*\| \| \| \| \|-- QueryExecutionResult.java*

*\| \| \| \|*

*\| \| \| \|-- repository/*

*\| \| \| \|*

*\| \| \| \|-- dto/*

*\| \| \| \|*

*\| \| \| \|-- exception/*

*\| \| \|*

*\| \| \|-- resources/*

*\| \| \|-- application.properties*

*\| \| \|-- static/*

*\| \| \| \|-- index.html*

*\| \| \| \|-- css/*

*\| \| \| \| \|-- styles.css*

*\| \| \| \|-- js/*

*\| \| \| \|-- app.js*

*\| \| \| \|-- api.js*

*\| \| \| \|-- scheduler.js*

*\| \| \| \|-- charts.js*

*\| \|*

*\| \|-- test/*

*\| \|-- java/*

*\| \|-- com/example/customerservice/*

*\| \|-- RoundRobinSchedulerTest.java*

*\| \|-- MetricsServiceTest.java*

*\| \|-- SimulationControllerTest.java*

*\|*

*\|-- data/*

* \|-- .gitkeep*

*This structure is a guideline. Claude may adjust package names and*

*repository organization when necessary, but the architecture must*

*remain modular.*

*\# 17. USER INTERFACE DESIGN REQUIREMENTS*

*Create a professional dashboard inspired by modern administrative*

*interfaces.*

*Design guidelines:*

*- Use a neutral background.*

*- Use consistent spacing.*

*- Use readable typography.*

*- Use clear headings.*

*- Use compact metric cards.*

*- Use tables with clear column labels.*

*- Use status badges.*

*- Use tooltips for scheduling metrics.*

*- Use a responsive layout.*

*- Ensure keyboard accessibility.*

*- Provide empty states.*

*- Provide loading states.*

*- Provide error states.*

*- Confirm destructive operations.*

*The interface should be visually polished but should prioritize*

*readability and correctness over decorative animations.*

*Avoid unnecessary gradients, excessive shadows, and clutter.*

*Use a left sidebar or top navigation with:*

*1. Dashboard*

*2. Customer Queries*

*3. Service Agents*

*4. Scheduler Simulator*

*5. Performance Analysis*

*6. Simulation History*

*7. Settings*

*The application should work on laptop screens and remain usable*

*on smaller displays.*

*\# 18. README REQUIREMENTS*

*Generate a README.md containing:*

*1. Project title.*

*2. Problem statement.*

*3. Objectives.*

*4. Features.*

*5. Technologies used.*

*6. Round Robin scheduling explanation.*

*7. Architecture overview.*

*8. Database schema overview.*

*9. API overview.*

*10. Installation instructions.*

*11. How to run the application.*

*12. How to run automated tests.*

*13. How to load sample data.*

*14. Example simulation walkthrough.*

*15. Explanation of scheduling metrics.*

*16. Screenshots section with placeholders.*

*17. Known limitations.*

*18. Future enhancements.*

*The README must contain actual commands that work with the*

*generated project.*

*Do not claim that unimplemented features are complete.*

*\# 19. IMPLEMENTATION PLAN*

*Implement the project in the following order.*

*Phase 1: Project Setup*

*- Create the Spring Boot Maven application.*

*- Configure Java and dependencies.*

*- Configure SQLite.*

*- Create entities and repositories.*

*- Verify the application starts successfully.*

*Phase 2: Scheduling Engine*

*- Implement RoundRobinScheduler.*

*- Implement the ready queue.*

*- Implement arrival-time handling.*

*- Implement preemption and requeuing.*

*- Record scheduling events.*

*- Calculate completion, waiting, turnaround, and response times.*

*- Write and run unit tests.*

*Phase 3: Agent Management*

*- Implement agent CRUD.*

*- Implement deterministic agent selection.*

*- Track agent availability.*

*- Add validation.*

*Phase 4: Query Management*

*- Implement query CRUD.*

*- Add search and filters.*

*- Add input validation.*

*- Prevent unsafe modifications during simulation.*

*Phase 5: Simulation API*

*- Implement simulation creation.*

*- Implement start, pause, resume, step, and reset.*

*- Persist simulation history.*

*- Expose scheduling events and metrics.*

*Phase 6: Frontend*

*- Create the dashboard.*

*- Create query management.*

*- Create agent management.*

*- Create the simulator.*

*- Create the Gantt chart.*

*- Create performance analysis.*

*- Connect the frontend to the backend.*

*Phase 7: Integration and Validation*

*- Test the complete workflow.*

*- Verify scheduling metrics.*

*- Test error handling.*

*- Verify database persistence.*

*- Verify the sample dataset.*

*- Fix any build or runtime errors.*

*Phase 8: Documentation*

*- Generate README.md.*

*- Explain the Round Robin implementation.*

*- Document setup and execution.*

*- Document limitations and future enhancements.*

*\# 20. ACCEPTANCE CRITERIA*

*The project is complete only when all the following conditions hold.*

*1. The Maven project builds successfully.*

*2. The Spring Boot application starts successfully.*

*3. The SQLite database persists records.*

*4. The user can create and manage customer queries.*

*5. The user can create and manage service agents.*

*6. The user can configure the time quantum.*

*7. The user can start and reset a simulation.*

*8. The user can execute one scheduling step at a time.*

*9. The ready queue follows FIFO Round Robin semantics.*

*10. Incomplete queries return to the end of the ready queue.*

*11. Completed queries are removed from the ready queue.*

*12. Arrival times are handled correctly.*

*13. Idle periods are recorded correctly.*

*14. The Gantt chart uses real backend scheduling events.*

*15. Waiting time is calculated correctly.*

*16. Turnaround time is calculated correctly.*

*17. Response time is calculated correctly.*

*18. Context switches follow the documented convention.*

*19. Resource utilization is calculated correctly.*

*20. The dashboard displays real application data.*

*21. Simulation history can be retrieved.*

*22. The sample dataset can be loaded reproducibly.*

*23. Unit tests pass.*

*24. Integration tests pass.*

*25. Invalid inputs produce useful error messages.*

*26. The README contains working setup instructions.*

*27. No essential feature is represented by hardcoded mock data.*

*28. The application clearly distinguishes simulation from real*

* concurrent agent execution.*

*\# 21. FUTURE ENHANCEMENTS*

*Possible future improvements include:*

*- Real-time WebSocket updates.*

*- Multiple independent service queues.*

*- Skill-based agent routing.*

*- Query priority categories.*

*- Agent performance analytics.*

*- Exporting reports to CSV.*

*- Comparing Round Robin against FCFS.*

*- Comparing different time quantum values.*

*- A separate parallel multi-agent simulation.*

*- Authentication and role-based access.*

*- A deployment-ready Docker configuration.*

*These enhancements are optional.*

*Do not implement them at the expense of correctness in the*

*core Round Robin scheduler.*

*\# 22. FINAL INSTRUCTIONS TO THE IMPLEMENTATION AGENT*

*Build a complete, runnable, end-to-end application according to*

*this specification.*

*Do not stop after generating an architecture diagram, pseudocode,*

*or a few sample classes.*

*Implement the backend, database, frontend, scheduling engine,*

*simulation controls, metrics, visualizations, and automated tests.*

*Before finishing:*

*1. Inspect the generated project structure.*

*2. Build the application.*

*3. Run all automated tests.*

*4. Fix compilation errors.*

*5. Fix failing tests.*

*6. Verify the sample scheduling results.*

*7. Verify the frontend communicates with the backend.*

*8. Verify database persistence.*

*9. Verify the Gantt chart uses real scheduling events.*

*10. Verify the README commands.*

*Do not claim that the project builds or tests pass unless you have*

*actually executed the relevant commands and checked the results.*

*If an environment limitation prevents execution, state the*

*limitation clearly.*

*Keep the implementation understandable for a student presenting*

*an Operating Systems laboratory project.*

*Prioritize correctness, modularity, usability, and clear*

*demonstration of Round Robin scheduling.*

