package com.example.customerservice;

import com.example.customerservice.repository.AgentRepository;
import com.example.customerservice.repository.AppSettingRepository;
import com.example.customerservice.repository.QueryExecutionResultRepository;
import com.example.customerservice.repository.QueryRepository;
import com.example.customerservice.repository.SchedulingEventRepository;
import com.example.customerservice.repository.SimulationRunRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end API tests: HTTP -> controllers -> services -> real SQLite file (target/test-data).
 * Run with: mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SimulationControllerTest {

    static {
        try {
            Files.createDirectories(Path.of("target", "test-data"));
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired QueryRepository queries;
    @Autowired AgentRepository agents;
    @Autowired SimulationRunRepository runs;
    @Autowired SchedulingEventRepository events;
    @Autowired QueryExecutionResultRepository results;
    @Autowired AppSettingRepository settings;

    @BeforeEach
    void cleanDatabase() {
        events.deleteAllInBatch();
        results.deleteAllInBatch();
        runs.deleteAllInBatch();
        queries.deleteAllInBatch();
        agents.deleteAllInBatch();
        settings.deleteAllInBatch();
    }

    private static final String QUERY_JSON = """
            {"customerName":"Asha","customerEmail":"asha@example.com","category":"PAYMENT_ISSUE",
             "description":"Charged twice","arrivalTime":0,"burstTime":4}""";

    private JsonNode json(String body) throws Exception {
        return mapper.readTree(body);
    }

    @Test
    void createAndRetrieveQuery() throws Exception {
        String body = mvc.perform(post("/api/queries").contentType(MediaType.APPLICATION_JSON).content(QUERY_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.remainingTime").value(4))
                .andReturn().getResponse().getContentAsString();
        long id = json(body).get("id").asLong();
        mvc.perform(get("/api/queries/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName").value("Asha"));
        mvc.perform(get("/api/queries?category=PAYMENT_ISSUE")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/queries?category=ACCOUNT_ISSUE")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/queries?name=ash")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(delete("/api/queries/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/queries/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void invalidInputGivesStructuredErrors() throws Exception {
        String bad = """
                {"customerName":"","customerEmail":"nope","category":"OTHER","description":"x","arrivalTime":-1,"burstTime":0}""";
        mvc.perform(post("/api/queries").contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.customerName").exists())
                .andExpect(jsonPath("$.fieldErrors.customerEmail").exists())
                .andExpect(jsonPath("$.fieldErrors.arrivalTime").exists())
                .andExpect(jsonPath("$.fieldErrors.burstTime").exists());
        mvc.perform(post("/api/queries").contentType(MediaType.APPLICATION_JSON).content("{ not json"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/simulations/9999")).andExpect(status().isNotFound());
        mvc.perform(post("/api/simulations/9999/reset")).andExpect(status().isNotFound());
        mvc.perform(get("/api/agents/9999")).andExpect(status().isNotFound());
    }

    @Test
    void createAndRetrieveAgentAndRejectDuplicateEmail() throws Exception {
        String agent = """
                {"name":"Agent X","email":"x@example.com","active":true}""";
        mvc.perform(post("/api/agents").contentType(MediaType.APPLICATION_JSON).content(agent))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.currentStatus").value("AVAILABLE"));
        mvc.perform(post("/api/agents").contentType(MediaType.APPLICATION_JSON).content(agent))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/agents")).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void invalidQuantumIsRejected() throws Exception {
        mvc.perform(post("/api/simulations").contentType(MediaType.APPLICATION_JSON).content("{\"timeQuantum\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/config").contentType(MediaType.APPLICATION_JSON).content("{\"timeQuantum\":-2}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void startingWithoutAgentsOrQueriesIsRejected() throws Exception {
        long id = createSimulation(2);
        mvc.perform(post("/api/simulations/" + id + "/start")).andExpect(status().isBadRequest()); // no queries
        mvc.perform(post("/api/queries").contentType(MediaType.APPLICATION_JSON).content(QUERY_JSON));
        mvc.perform(post("/api/simulations/" + id + "/start")).andExpect(status().isConflict());     // no agents
    }

    @Test
    void sampleDatasetFullWorkflowAndPersistence() throws Exception {
        mvc.perform(post("/api/sample-data")).andExpect(status().isOk());
        mvc.perform(post("/api/sample-data")).andExpect(status().isConflict());          // no duplicates
        mvc.perform(get("/api/queries")).andExpect(jsonPath("$.length()").value(5));
        mvc.perform(get("/api/agents")).andExpect(jsonPath("$.length()").value(3));

        long id = createSimulation(2);
        mvc.perform(post("/api/simulations/" + id + "/start")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RUNNING"));
        mvc.perform(post("/api/queries").contentType(MediaType.APPLICATION_JSON).content(QUERY_JSON))
                .andExpect(status().isConflict());                                        // locked while running
        mvc.perform(post("/api/simulations/" + id + "/pause")).andExpect(status().isOk());
        mvc.perform(post("/api/simulations/" + id + "/pause")).andExpect(status().isConflict());

        mvc.perform(post("/api/simulations/" + id + "/step")).andExpect(status().isOk())
                .andExpect(jsonPath("$.lastStep.outcome").value("REQUEUED"))
                .andExpect(jsonPath("$.lastStep.sliceDuration").value(2))
                .andExpect(jsonPath("$.lastStep.timeAfter").value(2));
        mvc.perform(get("/api/simulations/" + id + "/events")).andExpect(jsonPath("$.length()").value(1));

        String status = "PAUSED";
        int guard = 0;
        while (!"COMPLETED".equals(status) && guard++ < 30) {
            String body = mvc.perform(post("/api/simulations/" + id + "/step")).andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            status = json(body).get("status").asText();
        }
        assertEquals("COMPLETED", status);

        mvc.perform(post("/api/simulations/" + id + "/step")).andExpect(status().isConflict());
        mvc.perform(get("/api/simulations/" + id + "/events")).andExpect(jsonPath("$.length()").value(11));
        mvc.perform(get("/api/simulations/" + id + "/results")).andExpect(jsonPath("$.length()").value(5));
        mvc.perform(get("/api/simulations/" + id)).andExpect(jsonPath("$.metrics.avgWaitingTime").value(8.4))
                .andExpect(jsonPath("$.metrics.avgTurnaroundTime").value(12.4))
                .andExpect(jsonPath("$.metrics.avgResponseTime").value(3.4))
                .andExpect(jsonPath("$.metrics.contextSwitches").value(10))
                .andExpect(jsonPath("$.metrics.utilization").value(100.0));
        mvc.perform(get("/api/simulations/history")).andExpect(jsonPath("$[0].status").value("COMPLETED"));
        mvc.perform(get("/api/dashboard/summary")).andExpect(status().isOk())
                .andExpect(jsonPath("$.completedQueries").value(5));
        mvc.perform(get("/api/simulations/compare?quanta=1,2,4")).andExpect(jsonPath("$.length()").value(3));

        // A finished run is history: it cannot be reset, and a new run can be created and reset freely.
        mvc.perform(post("/api/simulations/" + id + "/reset")).andExpect(status().isConflict());
        long second = createSimulation(4);
        mvc.perform(post("/api/simulations/" + second + "/reset")).andExpect(status().isOk());
        mvc.perform(get("/api/simulations/" + id)).andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void stepIsBlockedWhenAllAgentsAreInactive() throws Exception {
        mvc.perform(post("/api/sample-data")).andExpect(status().isOk());
        long id = createSimulation(2);
        mvc.perform(post("/api/simulations/" + id + "/start")).andExpect(status().isOk());
        for (int agent = 1; agent <= 3; agent++) {
            mvc.perform(delete("/api/agents/" + agent)).andExpect(status().isOk());   // deactivate
        }
        mvc.perform(post("/api/simulations/" + id + "/step")).andExpect(status().isConflict());
        mvc.perform(get("/api/simulations/" + id)).andExpect(jsonPath("$.status").value("PAUSED"))
                .andExpect(jsonPath("$.stepsExecuted").value(0));
    }

    private long createSimulation(int quantum) throws Exception {
        String body = mvc.perform(post("/api/simulations").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"timeQuantum\":" + quantum + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json(body).get("id").asLong();
    }
}
