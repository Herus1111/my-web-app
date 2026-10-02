package de.fhdortmund.growdent.weather;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import de.fhdortmund.growdent.strategy.WeatherNotAvailableException;
import de.fhdortmund.growdent.strategy.WeatherProviderStrategy;

// Service ist nur für den API-Call zuständig 
@Service
public class WeatherService {

    private static final Logger logger = LoggerFactory.getLogger(WeatherService.class);
    private final WeatherProviderStrategy primaryStrategy;
    private final WeatherProviderStrategy fallbackStrategy;

    public WeatherService(
        @Qualifier("liveWeatherStrategy") WeatherProviderStrategy liveStrategy,
        @Qualifier("fallbackWeatherStrategy") WeatherProviderStrategy fallbackStrategy
    ) {
        this.primaryStrategy = liveStrategy;
        this.fallbackStrategy = fallbackStrategy;
    }

    public WeatherBean.Current getWeatherForDate(LocalDate date) {
        try {
            return primaryStrategy.fetchWeatherForDate(date);
        } catch (WeatherNotAvailableException e) {
            logger.warn("Datum zu weit in der Zukunft.", e.getMessage());
            return fallbackStrategy.fetchWeatherForDate(date);
        } catch (Exception e) {
            logger.error("Fehler beim Abrufen der Wetterdaten, weiche auf Fallback aus: {}", e.getMessage());
            return fallbackStrategy.fetchWeatherForDate(date);
        }
    }
}