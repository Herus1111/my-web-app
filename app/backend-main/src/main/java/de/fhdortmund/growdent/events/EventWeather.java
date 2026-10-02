package de.fhdortmund.growdent.events;

import jakarta.persistence.Embeddable;

@Embeddable // So muss keine extra Tabelle für Wetter angelegt werden. Jedes Event hat eine Objekt der Klasse Wetter.
public class EventWeather {
    private Double celsius;
    private Double precipitation;
    private String weatherStatus;

    public EventWeather() {
    }

    public EventWeather(Double celsius, Double precipitation, int weatherCode) {
        this.celsius = celsius;
        this.precipitation = precipitation;
        this.weatherStatus = weatherCodeToStatus(weatherCode);
    }

   private static String weatherCodeToStatus(int code) {
        return switch (code) {
            case -1 -> "Nicht verfügbar";
            case 0 -> "Sonnig";
            case 1, 2, 3 -> "Bewölkt";
            case 45, 48 -> "Nebel";
            case 51, 53, 55, 61, 63, 65 -> "Regen";
            case 71, 73, 75 -> "Schnee";
            case 95, 96, 99 -> "Gewitter";
            default -> "Unbekannt";
        };
    }

    public Double getCelsius() {
        return celsius;
    }

    public void setCelsius(Double celsius) {
        this.celsius = celsius;
    }

    public Double getPrecipitation() {
        return precipitation;
    }

    public void setPrecipitation(Double precipitation) {
        this.precipitation = precipitation;
    }

    public String getWeatherStatus() {
        return weatherStatus;
    }

    public void setWeatherStatus(String weatherStatus) {
        this.weatherStatus = weatherStatus;
    }
}
