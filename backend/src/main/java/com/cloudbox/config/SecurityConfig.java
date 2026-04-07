package com.cloudbox.config;

import com.cloudbox.security.JwtAuthFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // Disable CSRF
                .csrf(csrf -> csrf.disable())

                // Stateless session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Public
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/file/**").permitAll()
                        .requestMatchers("/api/public/info/**").permitAll()
                        .requestMatchers("/api/files/stream/**").permitAll()

                        // Admin
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // User + Admin
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")

                        // Files
                        .requestMatchers("/api/files/**").hasAnyRole("USER", "ADMIN")

                        // Everything else
                        .anyRequest().authenticated())

                // JWT filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
