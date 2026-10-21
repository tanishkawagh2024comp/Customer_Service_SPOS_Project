package com.example.customerservice;

import com.example.customerservice.dto.MetricsDto;
import com.example.customerservice.model.EventType;
import com.example.customerservice.scheduling.QueryResult;
import com.example.customerservice.scheduling.SchedEvent;
import com.example.customerservice.service.MetricsService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MetricsServiceTest {

    private final MetricsService metrics = new MetricsService();

    @Test
    void averagesAndUtilization() {
        List<QueryResult> results = List.of(
                new QueryResult(1, 0, 5, 0, 8, 3, 8, 0),
                new QueryResult(2, 0, 3, 2, 7, 4, 7, 2));
        MetricsDto m = metrics.compute(results, 4, 8, 8, 2);
        assertEquals(3.5, m.avgWaitingTime(), 1e-9);
        assertEquals(7.5, m.avgTurnaroundTime(), 1e-9);
        assertEquals(1.0, m.avgResponseTime(), 1e-9);
        assertEquals(100.0, m.utilization(), 1e-9);
        assertEquals(4, m.contextSwitches());
        assertEquals(2, m.completedQueries());
    }

    @Test
    void noCompletedQueriesGivesNotAvailableInsteadOfDivisionByZero() {
        MetricsDto m = metrics.compute(List.of(), 0, 0, 0, 3);
        assertNull(m.avgWaitingTime());
        assertNull(m.avgTurnaroundTime());
        assertNull(m.avgResponseTime());
        assertNull(m.utilization());
        assertEquals(3, m.totalQueries());
    }

    @Test
    void utilizationExcludesIdleTime() {
        // 3 units of work in 6 elapsed units -> 50 %
        MetricsDto m = metrics.compute(List.of(), 0, 3, 6, 2);
        assertEquals(50.0, m.utilization(), 1e-9);
    }

    @Test
    void contextSwitchConventionSkipsFirstDispatchAndIdle() {
        List<SchedEvent> events = List.of(
                new SchedEvent(1, 1L, 1L, 0, 2, 2, 0, EventType.COMPLETION),
                new SchedEvent(2, null, null, 2, 5, 3, null, EventType.IDLE),
                new SchedEvent(3, 2L, 1L, 5, 6, 1, 0, EventType.COMPLETION),
                new SchedEvent(4, 2L, 1L, 6, 7, 1, 0, EventType.COMPLETION));
        // Q1 -> (idle) -> Q2 counts once; Q2 -> Q2 does not count.
        assertEquals(1, MetricsService.countContextSwitches(events));
    }
}
