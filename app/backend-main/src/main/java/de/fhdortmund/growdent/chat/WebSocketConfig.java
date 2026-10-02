package de.fhdortmund.growdent.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173}")
    private String[] allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // для фронтенда через native WebSocket / @stomp/stompjs
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        // .withSockJS(); // включать только если frontend реально подключается через sockjs-client
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // für nachrichten vom server zum client
        config.enableSimpleBroker("/topic");

        // für nachrichten vom client zum server
        config.setApplicationDestinationPrefixes("/app");
    }
}