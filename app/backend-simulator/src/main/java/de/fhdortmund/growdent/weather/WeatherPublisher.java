package de.fhdortmund.growdent.weather;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Service;

@Service
public class WeatherPublisher {

    private static final Logger logger = LoggerFactory.getLogger(WeatherPublisher.class);

    private final WeatherService weatherService;
    private final MessageChannel mqttChannel;

    public WeatherPublisher(WeatherService weatherService, @Qualifier("mqttOutputChannel") MessageChannel mqttChannel){
        this.weatherService = weatherService;
        this.mqttChannel = mqttChannel;
    }

    public void publishWeatherForEvent(String eventId, LocalDate date) {
        WeatherBean.Current current = weatherService.getWeatherForDate(date);
        
        if (current == null) {
            logger.warn("Keine Wetterdaten für Event {} verfügbar", eventId);
            return;
        }

        String payload = String.format(
            "{\"eventId\": \"%s\", \"celsius\": %.1f, \"precipitation_mm\": %.1f, \"weathercode\": %d, \"message\": \"%s\"}",
            eventId,
            current.getCelsius(),
            current.getPrecipitation(),
            current.getWeathercode(),
            current.getMessage() != null ? current.getMessage() : ""
        );

        mqttChannel.send(MessageBuilder.withPayload(payload).build());

        logger.info("Gesendet an MQTT: " + payload);
    }
}