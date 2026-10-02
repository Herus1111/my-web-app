package de.fhdortmund.growdent.weather;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

// "Bean"-Klasse damit wir die JSON-Datei für den Broker schreiben können, siehe WeatherScheduler

@JsonIgnoreProperties(ignoreUnknown = true) // Felder die wir nicht brauchen werden ignoriert
public class WeatherBean {

    @JsonProperty("current")
    private Current current;

    @JsonProperty("daily")
    private Daily daily;

    public static class Current { // Aktuelle "Wetter Daten"
        
        private String message;

        @JsonProperty("temperature_2m")
        private double celsius;

        @JsonProperty("precipitation") // Niederschlag
        private double precipitation;

        @JsonProperty("weather_code")
        private int weathercode;

        public double getCelsius() {
            return celsius;
        }

        public void setCelsius(double celsius) {
            this.celsius = celsius;
        }

        public double getPrecipitation() {
            return precipitation;
        }

        public void setPrecipitation(double precipitation) {
            this.precipitation = precipitation;
        }

        public int getWeathercode() {
            return weathercode;
        }

        public void setWeathercode(int weathercode) {
            this.weathercode = weathercode;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Daily {
        
        @JsonProperty("temperature_2m_max")
        private List<Double> temperatureMax;

        @JsonProperty("rain_sum")
        private List<Double> rainSum;

        @JsonProperty("weather_code")
        private List<Integer> weatherCode;

        public List<Double> getTemperatureMax() {
            return temperatureMax;
        }

        public void setTemperatureMax(List<Double> temperatureMax) {
            this.temperatureMax = temperatureMax;
        }

        public List<Double> getRainSum() {
            return rainSum;
        }

        public void setRainSum(List<Double> rainSum) {
            this.rainSum = rainSum;
        }

        public List<Integer> getWeatherCode() {
            return weatherCode;
        }

        public void setWeatherCode(List<Integer> weatherCode) {
            this.weatherCode = weatherCode;
        }

        // Hilfsmethode um den ersten Wert als Current zurückzugeben
        public Current toCurrentDay() {
            Current c = new Current();
            c.setCelsius(temperatureMax.get(0));
            c.setPrecipitation(rainSum.get(0));
            c.setWeathercode(weatherCode.get(0));
            return c;
        }
    }

    public Current getCurrent() {
        return current;
    }

    public void setCurrent(Current current) {
        this.current = current;
    }

    public Daily getDaily() {
        return daily;
    }

    public void setDaily(Daily daily) {
        this.daily = daily;
    }
}
