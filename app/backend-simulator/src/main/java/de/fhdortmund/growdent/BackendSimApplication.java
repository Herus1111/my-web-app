package de.fhdortmund.growdent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication // Damit die API Abfrage in einem Interval stattfindet
@EnableScheduling
public class BackendSimApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendSimApplication.class, args);
    }
}