package com.sentinel.backend.config;

import com.sentinel.backend.security.JwtChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    public WebSocketConfig(JwtChannelInterceptor jwtChannelInterceptor) {
        this.jwtChannelInterceptor = jwtChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Child devices and parent dashboards connect here
        registry.addEndpoint("/ws/sensor")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Raw WebSocket endpoint (no SockJS) for React Native
        registry.addEndpoint("/ws/sensor")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages FROM client TO server (@MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");

        // Simple in-memory broker for subscriptions (parent dashboard subscribes)
        // /topic/location/{childId} — live location updates
        // /topic/alerts/{childId}   — alert notifications
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Validate JWT on STOMP CONNECT
        registration.interceptors(jwtChannelInterceptor);
    }
}
