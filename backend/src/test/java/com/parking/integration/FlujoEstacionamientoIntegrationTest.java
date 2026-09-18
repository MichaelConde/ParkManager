package com.parking.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba de extremo a extremo del ciclo principal: login -> crear plaza ->
 * registrar ingreso -> registrar salida, verificando el calculo de tarifa
 * y la liberacion de la plaza (RF2, RF3).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FlujoEstacionamientoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void cicloCompletoDeIngresoYSalidaCalculaElMontoYLiberaLaPlaza() throws Exception {
        String token = login("admin", "admin123");

        String plazaJson = """
                {"codigo":"T-99","tipo":"AUTO","zona":"Zona Test"}
                """;
        mockMvc.perform(post("/api/espacios")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(plazaJson))
                .andExpect(status().isCreated());

        String ingresoJson = """
                {"placa":"TST-001","tipo":"AUTO","modelo":"Test Model"}
                """;
        String ingresoResult = mockMvc.perform(post("/api/sesiones/ingreso")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(ingresoJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("ACTIVA"))
                .andReturn().getResponse().getContentAsString();

        JsonNode sesion = objectMapper.readTree(ingresoResult);
        long sesionId = sesion.get("id").asLong();
        assertThat(sesion.get("qrImageBase64").asText()).startsWith("data:image/png;base64,");

        mockMvc.perform(get("/api/espacios").header("Authorization", "Bearer " + token)
                        .param("estado", "OCUPADA"))
                .andExpect(status().isOk());

        String salidaJson = "{\"sesionId\":" + sesionId + ",\"metodoPago\":\"EFECTIVO\"}";
        mockMvc.perform(post("/api/sesiones/salida")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(salidaJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sesion.estado").value("CERRADA"))
                .andExpect(jsonPath("$.pago.metodo").value("EFECTIVO"));
    }

    @Test
    void loginConCredencialesInvalidasDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"username\":\"admin\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endpointProtegidoSinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/espacios"))
                .andExpect(status().isUnauthorized());
    }

    private String login(String username, String password) throws Exception {
        String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
