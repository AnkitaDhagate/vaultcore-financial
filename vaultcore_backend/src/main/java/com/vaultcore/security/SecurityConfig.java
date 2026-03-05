package com.vaultcore.config;

import com.vaultcore.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * ✅ FIXES APPLIED:
 * 1. CORS configured properly via CorsConfigurationSource bean (not disabled)
 * 2. OPTIONS preflight requests permitted FIRST before any auth check
 * 3. /api/auth/** permitted without token
 * 4. Stateless session (JWT-based, no HttpSession)
 * 5. Removed duplicate WebMvcConfigurer CORS — only one CORS config needed
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)

                // ✅ Use our CorsConfigurationSource bean — do NOT disable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ✅ Stateless — JWT, no sessions
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // ✅ OPTIONS preflight MUST be first — browsers send this before every request
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Auth endpoints open — no token needed for login/register
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ Public endpoints
                        .requestMatchers("/api/public/**").permitAll()

                        // ✅ Everything else requires valid JWT
                        .anyRequest().authenticated()
                )

                // ✅ JWT filter runs before Spring's default auth filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        // ✅ Must exactly match the origin React runs on
        config.setAllowedOrigins(List.of("http://localhost:3000"));

        config.setAllowedHeaders(Arrays.asList(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        config.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition"
        ));

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
