package de.fhdortmund.growdent.strategy;

import org.springframework.stereotype.Component;

import de.fhdortmund.growdent.weather.WeatherBean;
import de.fhdortmund.growdent.weather.WeatherBean.Current;

import java.time.LocalDate;

@Component("fallbackWeatherStrategy")
public class WeatherFallbackStrategy implements WeatherProviderStrategy {

    @Override
    public WeatherBean.Current fetchWeatherForDate(LocalDate date) {
        Current fallback = new Current();
        fallback.setMessage("Wetterdaten nicht verfügbar");
        return fallback;
    }
    
}