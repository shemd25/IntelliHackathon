package com.sentinel.backend.service;

import com.sentinel.backend.dto.AuthRequest;
import com.sentinel.backend.dto.AuthResponse;
import com.sentinel.backend.model.Parent;
import com.sentinel.backend.repository.ParentRepository;
import com.sentinel.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class AuthService {

    private final ParentRepository parentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(ParentRepository parentRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.parentRepository = parentRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Authenticate parent by email/password and return JWT + child list.
     */
    public AuthResponse login(AuthRequest request) {
        Parent parent = parentRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), parent.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = tokenProvider.generateToken(parent.getId(), parent.getEmail());

        return AuthResponse.builder()
                .token(token)
                .parentId(parent.getId())
                .email(parent.getEmail())
                .children(parent.getChildren().stream()
                        .map(child -> AuthResponse.ChildInfo.builder()
                                .id(child.getId())
                                .name(child.getName())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
