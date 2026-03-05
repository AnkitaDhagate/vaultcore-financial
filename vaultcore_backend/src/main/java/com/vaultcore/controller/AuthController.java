package com.vaultcore.controller;

import com.vaultcore.dto.JwtResponse;
import com.vaultcore.dto.LoginRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.User;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.UserRepository;
import com.vaultcore.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * ✅ FIXES:
 * 1. Login returns userId in JwtResponse → frontend stores it → accounts load correctly
 * 2. Register auto-creates SAVINGS + CHECKING accounts for every new user
 *    → Fixes "No accounts found" on Transfer/Dashboard for new users
 * 3. Proper 401 for bad credentials, consistent {"message":"..."} error shape
 * 4. Duplicate username + email check on register
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
        origins = "http://localhost:3000",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET, RequestMethod.POST,
                RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS
        }
)
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth controller is reachable!");
    }

    // POST http://localhost:8081/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        if (loginRequest.getUsername() == null || loginRequest.getUsername().isBlank())
            return ResponseEntity.badRequest().body(errorResponse("Username is required"));
        if (loginRequest.getPassword() == null || loginRequest.getPassword().isBlank())
            return ResponseEntity.badRequest().body(errorResponse("Password is required"));

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername().trim(),
                            loginRequest.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt          = jwtUtil.generateToken(loginRequest.getUsername().trim());
            String refreshToken = jwtUtil.generateRefreshToken(loginRequest.getUsername().trim());

            User user = userRepository
                    .findByUsername(loginRequest.getUsername().trim())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(new JwtResponse(
                    jwt, refreshToken, user.getId(), user.getUsername(), user.getRole()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Invalid username or password"));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Account is disabled"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Login failed: " + e.getMessage()));
        }
    }

    // POST http://localhost:8081/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (user.getUsername() == null || user.getUsername().isBlank())
            return ResponseEntity.badRequest().body(errorResponse("Username is required"));
        if (user.getPassword() == null || user.getPassword().isBlank())
            return ResponseEntity.badRequest().body(errorResponse("Password is required"));
        if (user.getEmail() == null || user.getEmail().isBlank())
            return ResponseEntity.badRequest().body(errorResponse("Email is required"));
        if (user.getPassword().length() < 6)
            return ResponseEntity.badRequest().body(errorResponse("Password must be at least 6 characters"));
        if (!user.getEmail().contains("@"))
            return ResponseEntity.badRequest().body(errorResponse("Invalid email address"));

        try {
            if (userRepository.findByUsername(user.getUsername().trim()).isPresent())
                return ResponseEntity.badRequest()
                        .body(errorResponse("Username already exists. Please choose a different username"));

            if (userRepository.findByEmail(user.getEmail().trim()).isPresent())
                return ResponseEntity.badRequest()
                        .body(errorResponse("Email already registered. Please login or use a different email"));

            user.setUsername(user.getUsername().trim());
            user.setEmail(user.getEmail().trim());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole("USER");
            User savedUser = userRepository.save(user);

            // ✅ Auto-create SAVINGS + CHECKING accounts so Transfer page is never empty
            createDefaultAccounts(savedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful! Your Savings and Checking accounts have been created.");
            response.put("userId", savedUser.getId());
            response.put("username", savedUser.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Every new user gets:
     *  - SAVINGS account with $1,000.00 starting balance
     *  - CHECKING account with $500.00 starting balance
     * Account number format: VC{userId}{TYPE}{4-char random suffix}
     */
    private void createDefaultAccounts(User user) {
        String uid    = String.valueOf(user.getId());
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Account savings = new Account();
        savings.setUser(user);
        savings.setAccountType("SAVINGS");
        savings.setAccountNumber("VC" + uid + "SAV" + suffix);
        savings.setBalance(new BigDecimal("1000.00"));
        accountRepository.save(savings);

        Account checking = new Account();
        checking.setUser(user);
        checking.setAccountType("CHECKING");
        checking.setAccountNumber("VC" + uid + "CHK" + suffix);
        checking.setBalance(new BigDecimal("500.00"));
        accountRepository.save(checking);
    }

    private Map<String, String> errorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        return error;
    }
}
