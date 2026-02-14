package com.vaultcore.controller;

import com.vaultcore.model.AuthRequest;
import com.vaultcore.model.AuthResponse;
import com.vaultcore.model.User;
import com.vaultcore.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            String[] tokens = authService.authenticate(
                authRequest.getUsername(), 
                authRequest.getPassword()
            );
            
            return ResponseEntity.ok(new AuthResponse(
                tokens[0], 
                tokens[1], 
                "Bearer",
                null,
                authRequest.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User registeredUser = authService.registerUser(user);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestParam String refreshToken) {
        try {
            String newAccessToken = authService.refreshAccessToken(refreshToken);
            return ResponseEntity.ok(new AuthResponse(
                newAccessToken,
                refreshToken,
                "Bearer",
                null,
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid refresh token");
        }
    }
}