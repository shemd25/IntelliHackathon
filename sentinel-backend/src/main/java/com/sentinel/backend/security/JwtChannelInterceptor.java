package com.sentinel.backend.security;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;

/**
 * Intercepts STOMP CONNECT frames to validate JWT and set the user principal
 * on the WebSocket session. All subsequent STOMP messages inherit this principal.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;

    public JwtChannelInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                if (tokenProvider.validateToken(token)) {
                    UUID parentId = tokenProvider.getParentIdFromToken(token);
                    String email = tokenProvider.getEmailFromToken(token);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(parentId, email, Collections.emptyList());
                    accessor.setUser(auth);
                } else {
                    throw new IllegalArgumentException("Invalid JWT token on WebSocket CONNECT");
                }
            } else {
                throw new IllegalArgumentException("Missing Authorization header on WebSocket CONNECT");
            }
        }
        return message;
    }
}
