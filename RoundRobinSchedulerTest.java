package com.example.customerservice;

import com.example.customerservice.exception.NoEligibleAgentException;
import com.example.customerservice.model.EventType;
import com.example.customerservice.model.QueryStatus;
import com.example.customerservice.scheduling.AgentInfo;
import com.example.customerservice.scheduling.QueryResult;
import com.example.customerservice.scheduling.ScheduledQuery;
import com.example.customerservice.scheduling.SchedEvent;
import com.example.customerservice.scheduling.SchedulerState;
import com.example.customerservice.scheduling.SchedulingResult;
import com.example.customerservice.scheduling.StepResult;
import com.example.customerservice.service.AgentAssignmentService;
import com.example.customerservice.service.RoundRobinScheduler;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Unit tests for the Round Robin engine (plain JUnit, no Spring context needed). */
class RoundRobinSchedulerTest {

    private final RoundRobinScheduler scheduler = new RoundRobinScheduler(new AgentAssignmentService());

    private List<AgentInfo> agents() {
        return List.of(new AgentInfo(1, true), new AgentInfo(2, true), new AgentInfo(3, true));
    }

    private ScheduledQuery q(long id, int arrival, int burst) {
        return new ScheduledQuery(id, arrival, burst, id);
    }

    private QueryResult result(SchedulingResult r, long id) {
        return r.results().stream().filter(x -> x.queryId() == id).findFirst().orElseThrow();
    }

    private void assertSlice(SchedEvent e, long query, int start, int end) {
        assertEquals(query, e.queryId());
        assertEquals(start, e.startTime());
        assertEquals(end, e.endTime());
    }

    @Test
    void test01_singleQuery() {
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 5)), 2, agents());
        QueryResult q1 = result(r, 1);
        assertEquals(5, q1.completionTime());
        assertEquals(0, q1.waitingTime());
        assertEquals(5, q1.turnaroundTime());
        assertEquals(0, q1.responseTime());
    }

    @Test
    void test02_twoQueries() {
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 5), q(2, 0, 3)), 2, agents());
        List<SchedEvent> e = r.events();
        assertEquals(5, e.size());
        assertSlice(e.get(0), 1, 0, 2);
        assertSlice(e.get(1), 2, 2, 4);
        assertSlice(e.get(2), 1, 4, 6);
        assertSlice(e.get(3), 2, 6, 7);
        assertSlice(e.get(4), 1, 7, 8);
        QueryResult q1 = result(r, 1);
        assertEquals(8, q1.completionTime());
        assertEquals(8, q1.turnaroundTime());
        assertEquals(3, q1.waitingTime());
        assertEquals(0, q1.responseTime());
        QueryResult q2 = result(r, 2);
        assertEquals(7, q2.completionTime());
        assertEquals(7, q2.turnaroundTime());
        assertEquals(4, q2.waitingTime());
        assertEquals(2, q2.responseTime());
    }

    @Test
    void test03_queryArrivingLaterCreatesIdleInterval() {
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 2), q(2, 5, 1)), 2, agents());
        List<SchedEvent> e = r.events();
        assertEquals(3, e.size());
        assertSlice(e.get(0), 1, 0, 2);
        assertEquals(EventType.IDLE, e.get(1).eventType());
        assertEquals(2, e.get(1).startTime());
        assertEquals(5, e.get(1).endTime());
        assertEquals(null, e.get(1).queryId());
        assertSlice(e.get(2), 2, 5, 6);
        assertEquals(6, r.finalTime());
        assertEquals(3, r.busyTime());
    }

    @Test
    void test04_burstSmallerThanQuantum() {
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 1)), 4, agents());
        assertEquals(1, result(r, 1).completionTime());
        assertEquals(1, r.events().get(0).allocatedDuration());
        assertEquals(1, r.busyTime());
    }

    @Test
    void test05_burstEqualToQuantumIsNotRequeued() {
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 2)), 2, agents());
        assertEquals(2, result(r, 1).completionTime());
        assertEquals(1, r.events().size());
        assertEquals(EventType.COMPLETION, r.events().get(0).eventType());
    }

    @Test
    void test06_simultaneousArrivalsFollowCreationSequence() {
        // Passed in reverse order on purpose: creation sequence must decide, not list position.
        List<ScheduledQuery> in = List.of(q(3, 0, 2), q(1, 0, 2), q(2, 0, 2));
        SchedulingResult r = scheduler.run(in, 1, agents());
        assertEquals(1, r.events().get(0).queryId());
        assertEquals(2, r.events().get(1).queryId());
        assertEquals(3, r.events().get(2).queryId());
        assertEquals(1, r.events().get(3).queryId());
    }

    @Test
    void test07_emptyDataset() {
        SchedulingResult r = scheduler.run(List.of(), 2, agents());
        assertTrue(r.events().isEmpty());
        assertTrue(r.results().isEmpty());
        assertEquals(0, r.finalTime());
    }

    @Test
    void test08_invalidQuantumIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> scheduler.run(List.of(q(1, 0, 2)), 0, agents()));
        assertThrows(IllegalArgumentException.class, () -> scheduler.run(List.of(q(1, 0, 2)), -3, agents()));
    }

    @Test
    void invalidQueryTimesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> scheduler.run(List.of(q(1, -1, 2)), 2, agents()));
        assertThrows(IllegalArgumentException.class, () -> scheduler.run(List.of(q(1, 0, 0)), 2, agents()));
    }

    @Test
    void test09_metricInvariants() {
        List<ScheduledQuery> in = List.of(q(1, 0, 5), q(2, 0, 4), q(3, 1, 2), q(4, 3, 6), q(5, 5, 3), q(6, 40, 2));
        for (int quantum : new int[]{1, 2, 3, 4, 5, 10}) {
            List<ScheduledQuery> fresh = new ArrayList<>();
            for (ScheduledQuery s : in) fresh.add(new ScheduledQuery(s.getId(), s.getArrivalTime(), s.getBurstTime(), s.getCreationSequence()));
            SchedulingResult r = scheduler.run(fresh, quantum, agents());
            assertEquals(in.size(), r.results().size());
            for (QueryResult x : r.results()) {
                assertEquals(x.completionTime() - x.arrivalTime(), x.turnaroundTime());
                assertEquals(x.turnaroundTime() - x.burstTime(), x.waitingTime());
                assertEquals(x.firstStartTime() - x.arrivalTime(), x.responseTime());
                assertTrue(x.waitingTime() >= 0);
                assertTrue(x.responseTime() >= 0);
                assertTrue(x.completionTime() >= x.firstStartTime());
            }
        }
    }

    @Test
    void test10_remainingTimeInvariant() {
        List<ScheduledQuery> in = List.of(q(1, 0, 5), q(2, 2, 3), q(3, 4, 7));
        SchedulerState state = scheduler.create(in, 2, agents());
        List<AgentInfo> ag = agents();
        while (!state.isFinished()) {
            scheduler.step(state, ag);
            for (ScheduledQuery s : in) {
                assertTrue(s.getRemainingTime() >= 0 && s.getRemainingTime() <= s.getBurstTime());
                if (s.getStatus() == QueryStatus.COMPLETED) {
                    assertEquals(0, s.getRemainingTime());
                }
            }
        }
    }

    @Test
    void test11_noStarvationEveryQueryCompletes() {
        List<ScheduledQuery> in = new ArrayList<>();
        for (int i = 1; i <= 30; i++) in.add(q(i, i % 7, 1 + (i * 3) % 11));
        SchedulingResult r = scheduler.run(in, 3, agents());
        assertEquals(30, r.results().size());
        for (ScheduledQuery s : in) assertEquals(0, s.getRemainingTime());
    }

    @Test
    void test12_onlyActiveAgentsAreAssignedAndReleased() {
        AgentInfo offline = new AgentInfo(1, false);   // lowest ID but inactive
        AgentInfo a2 = new AgentInfo(2, true);
        AgentInfo a3 = new AgentInfo(3, true);
        List<AgentInfo> ag = List.of(offline, a2, a3);
        SchedulingResult r = scheduler.run(List.of(q(1, 0, 5), q(2, 0, 3)), 2, ag);
        for (SchedEvent e : r.events()) {
            if (e.eventType() != EventType.IDLE) {
                assertNotNull(e.agentId());
                assertEquals(2L, e.agentId());          // lowest ACTIVE id
            }
        }
        assertEquals(0, offline.getAssignedSlices());
        assertEquals(0, a3.getAssignedSlices());
        assertEquals(5, a2.getAssignedSlices());
        assertEquals(8, a2.getTotalServiceTime());
        // Released after each slice: agent is AVAILABLE again, offline agent stays OFFLINE.
        assertEquals("AVAILABLE", a2.getStatus().name());
        assertEquals("OFFLINE", offline.getStatus().name());
    }

    @Test
    void noEligibleAgentRejectedAtCreation() {
        List<AgentInfo> none = List.of(new AgentInfo(1, false));
        assertThrows(NoEligibleAgentException.class, () -> scheduler.create(List.of(q(1, 0, 2)), 2, none));
        assertThrows(NoEligibleAgentException.class, () -> scheduler.create(List.of(q(1, 0, 2)), 2, List.of()));
    }

    @Test
    void blockedStepDoesNotLoseTheQuery() {
        SchedulerState state = scheduler.create(List.of(q(1, 0, 4)), 2, agents());
        List<AgentInfo> allOffline = List.of(new AgentInfo(1, false));
        StepResult blocked = scheduler.step(state, allOffline);
        assertTrue(blocked.blocked());
        assertEquals(List.of(1L), state.readyQueueIds());
        assertEquals(0, state.getCurrentTime());
        // After an agent comes back the same query is served normally.
        StepResult ok = scheduler.step(state, agents());
        assertFalse(ok.blocked());
        assertEquals(1L, ok.queryId());
    }

    @Test
    void arrivalsDuringSliceAreQueuedBeforeThePreemptedQuery() {
        // Q1 runs 0-2 and Q2 arrives at 1, so the queue must be [Q2, Q1] afterwards.
        SchedulerState state = scheduler.create(List.of(q(1, 0, 5), q(2, 1, 3)), 2, agents());
        scheduler.step(state, agents());
        assertEquals(List.of(2L, 1L), state.readyQueueIds());
    }

    @Test
    void sameInputGivesIdenticalOutput() {
        List<ScheduledQuery> a = List.of(q(1, 0, 5), q(2, 0, 4), q(3, 1, 2));
        List<ScheduledQuery> b = List.of(q(1, 0, 5), q(2, 0, 4), q(3, 1, 2));
        assertEquals(scheduler.run(a, 2, agents()).events(), scheduler.run(b, 2, agents()).events());
    }

    @Test
    void sampleDatasetFromSpecification() {
        List<ScheduledQuery> sample = List.of(q(1, 0, 5), q(2, 0, 4), q(3, 1, 2), q(4, 3, 6), q(5, 5, 3));
        SchedulingResult r = scheduler.run(sample, 2, agents());
        long[] order = {1, 2, 3, 1, 4, 2, 5, 1, 4, 5, 4};
        int[] ends = {2, 4, 6, 8, 10, 12, 14, 15, 17, 18, 20};
        assertEquals(order.length, r.events().size());
        for (int i = 0; i < order.length; i++) {
            assertEquals(order[i], r.events().get(i).queryId());
            assertEquals(ends[i], r.events().get(i).endTime());
        }
        assertEquals(15, result(r, 1).completionTime());
        assertEquals(10, result(r, 1).waitingTime());
        assertEquals(12, result(r, 2).completionTime());
        assertEquals(8, result(r, 2).waitingTime());
        assertEquals(6, result(r, 3).completionTime());
        assertEquals(5, result(r, 3).turnaroundTime());
        assertEquals(3, result(r, 3).waitingTime());
        assertEquals(3, result(r, 3).responseTime());
        assertEquals(20, result(r, 4).completionTime());
        assertEquals(11, result(r, 4).waitingTime());
        assertEquals(18, result(r, 5).completionTime());
        assertEquals(10, result(r, 5).waitingTime());
        assertEquals(20, r.finalTime());
        assertEquals(20, r.busyTime());
        assertEquals(10, r.contextSwitches());
    }

    @Test
    void quantumOneAndLargeQuantumBehaveLikeFcfs() {
        List<ScheduledQuery> in = List.of(q(1, 0, 3), q(2, 0, 3));
        SchedulingResult one = scheduler.run(in, 1, agents());
        assertEquals(6, one.events().size());
        List<ScheduledQuery> in2 = List.of(q(1, 0, 3), q(2, 0, 3));
        SchedulingResult big = scheduler.run(in2, 100, agents());
        assertEquals(2, big.events().size());
        assertEquals(3, result(big, 1).completionTime());
        assertEquals(6, result(big, 2).completionTime());
        assertEquals(1, big.contextSwitches());
    }
}
