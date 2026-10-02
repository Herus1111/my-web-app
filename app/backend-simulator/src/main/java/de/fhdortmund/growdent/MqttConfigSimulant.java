package de.fhdortmund.growdent;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

// In dieser Klasse sagen wir Spring Boot wie und wohin es MQTT-Nachrichten schicken soll

@Configuration
@EnableIntegration  
public class MqttConfigSimulant {

    private static final Logger logger = LoggerFactory.getLogger(MqttConfigSimulant.class);

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{"tcp://mosquitto:1883"});
        options.setKeepAliveInterval(30);
        options.setAutomaticReconnect(true);
        options.setCleanSession(false);
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttOutputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutputChannel")
    public MessageHandler mqttOutput(MqttPahoClientFactory factory) {
        logger.info("Wetter-Daten werden gesendet...");
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler("weather-simulant-publisher", factory);
        handler.setDefaultTopic("event/weather/response");
        handler.setDefaultQos(1);
        return handler;
    }

    @Bean
    public MessageProducer mqttInbound(MqttPahoClientFactory factory) {
        MqttPahoMessageDrivenChannelAdapter adapter = 
            new MqttPahoMessageDrivenChannelAdapter(
                "weather-simulant-subscriber",
                factory,
                "event/weather/request"
            );
        adapter.setCompletionTimeout(5000);
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

}