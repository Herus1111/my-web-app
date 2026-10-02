package de.fhdortmund.growdent.strategy;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import de.fhdortmund.growdent.weather.WeatherBean;

@Component("liveWeatherStrategy")
public class WeatherMeteoStrategy implements WeatherProviderStrategy {
    private final RestClient restClient = RestClient.create();

    @Override
    public WeatherBean.Current fetchWeatherForDate(LocalDate date) {
        long daysUntilEvent = ChronoUnit.DAYS.between(LocalDate.now(), date);
        
        if (daysUntilEvent > 15 || daysUntilEvent < 0) {
            throw new WeatherNotAvailableException(date);
        }
        
        WeatherBean response = restClient.get()
            .uri("https://api.open-meteo.com/v1/forecast" +
                "?latitude=51.5149&longitude=7.466" +
                "&daily=temperature_2m_max,rain_sum,weather_code" +
                "&start_date=" + date +
                "&end_date=" + date +
                "&timezone=Europe/Berlin")
            .retrieve()
            .body(WeatherBean.class);

        return response.getDaily().toCurrentDay();
    }
}