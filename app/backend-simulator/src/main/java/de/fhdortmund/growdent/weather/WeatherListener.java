package de.fhdortmund.growdent.weather;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class WeatherListener {

    private static final Logger logger = LoggerFactory.getLogger(WeatherListener.class);
    private final WeatherPublisher weatherPublisher;

    public WeatherListener(WeatherPublisher weatherPublisher) {
        this.weatherPublisher = weatherPublisher;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleEventWeatherRequest(String payload) {
        logger.info("Event Wetter-Anfrage erhalten: {}", payload);
        ObjectMapper mapper = new ObjectMapper();

        try {
            JsonNode json = mapper.readTree(payload);
            String eventId = json.get("eventId").asText();
            LocalDate date = LocalDate.parse(json.get("date").asText());
            weatherPublisher.publishWeatherForEvent(eventId, date);    
        } catch (JsonProcessingException e) {
            logger.error("Fehler beim parsen des JSON-Objekt {}", e.getMessage());
        }
    }
}