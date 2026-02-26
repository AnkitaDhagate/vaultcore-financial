package com.vaultcore.controller;

import com.vaultcore.dto.AuthRequest;
import com.vaultcore.dto.AuthResponse;
import com.vaultcore.dto.RegisterRequest;
import com.vaultcore.model.RefreshToken;
import com.vaultcore.model.User;
import com.vaultcore.repository.RefreshTokenRepository;
import com.vaultcore.repository.UserRepository;
import com.vaultcore.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            
            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);
            
            // Save refresh token
            RefreshToken rt = new RefreshToken();
            rt.setUser(user);
            rt.setToken(refreshToken);
            rt.setExpiresAt(LocalDateTime.now().plusDays(7));
            refreshTokenRepository.save(rt);
            
            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            
            return ResponseEntity.ok(new AuthResponse(
                accessToken, refreshToken, "Bearer",
                user.getUserId(), user.getUsername(), 
                user.getFullName(), user.getTwoFactorEnabled() == 1
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials"));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setTwoFactorEnabled(0);
        user.setAccountNonLocked(1);
        user.setFailedAttempts(0);
        user.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        RefreshToken rt = refreshTokenRepository.findByToken(refreshToken).orElse(null);
        
        if (rt == null || rt.getRevoked() == 1 || rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid refresh token"));
        }
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(rt.getUser().getUsername());
        String newAccessToken = jwtService.generateToken(userDetails);
        
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        refreshTokenRepository.deleteByToken(refreshToken);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}