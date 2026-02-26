package com.vaultcore.controller;

import com.vaultcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/db-connection")
    public ResponseEntity<?> testDatabaseConnection() {
        Map<String, Object> response = new HashMap<>();
        try {
            long count = userRepository.count();
            response.put("status", "SUCCESS");
            response.put("message", "Database connected successfully!");
            response.put("userCount", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Database connection failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}