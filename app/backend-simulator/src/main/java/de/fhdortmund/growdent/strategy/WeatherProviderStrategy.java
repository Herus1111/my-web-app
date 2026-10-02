package de.fhdortmund.growdent.strategy;

import java.time.LocalDate;

import de.fhdortmund.growdent.weather.WeatherBean;

public interface WeatherProviderStrategy {
    public WeatherBean.Current fetchWeatherForDate(LocalDate date);
}
