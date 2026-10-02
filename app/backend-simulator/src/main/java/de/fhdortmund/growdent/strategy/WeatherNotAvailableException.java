package de.fhdortmund.growdent.strategy;

import java.time.LocalDate;

public class WeatherNotAvailableException extends RuntimeException {
    public WeatherNotAvailableException(LocalDate date) {
        super("Keine Wetterdaten verfügbar für: " + date);
    }
}