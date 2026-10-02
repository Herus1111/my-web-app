package de.fhdortmund.growdent.events;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.stereotype.Component;

@Component
public class EventWeatherListener {

    private static final Logger logger = LoggerFactory.getLogger(EventWeatherListener.class);
    private final EventService eventService;
    private final ObjectMapper mapper = new ObjectMapper();

    public EventWeatherListener(EventService eventService) {
        this.eventService = eventService;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleWeatherResponse(String payload) {
        logger.info("Wetter-Antwort erhalten: {}", payload);

        try {
            JsonNode json = mapper.readTree(payload);
            int eventId = json.get("eventId").asInt();
            String message = json.get("message").asText();

            if (message != null && !message.isEmpty()) {
                eventService.updateWeather(eventId, null, null, -1);
            } else {
                double celsius = json.get("celsius").asDouble();
                double precipitation = json.get("precipitation_mm").asDouble();
                int weatherCode = json.get("weathercode").asInt();
                eventService.updateWeather(eventId, celsius, precipitation, weatherCode);
            }
        } catch (Exception e) {
            logger.error("Fehler beim Verarbeiten der Wetter-Antwort: {}", e.getMessage());
        }
    }
}