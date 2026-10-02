package de.fhdortmund.growdent.broker;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
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

@Configuration
@EnableIntegration  
public class MqttConfigMain {

    // Verbindung zum Broker herstellen
    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setServerURIs(new String[]{"tcp://mosquitto:1883"});
        options.setKeepAliveInterval(30);
        options.setCleanSession(false);
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }
    
    @Bean
    public MessageChannel mqttOutputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer mqttInbound(MqttPahoClientFactory factory) {
        System.out.println("Wetter-Daten werden gelesen...");
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter("weather-main-subscriber", factory, "event/weather/response");
        adapter.setCompletionTimeout(5000);
        adapter.setQos(1); 
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutputChannel")
    public MessageHandler mqttOutbound(MqttPahoClientFactory factory){
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler("weather-main-publisher", factory);
        handler.setDefaultTopic("event/weather/request");
        handler.setDefaultQos(1);
        return handler;
    }
}