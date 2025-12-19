package com.authshield.server.config;

import com.authshield.server.repo.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public UserDetailsService userDetailsService(UserRepository users) {
    return username -> users.findByUsername(username)
      .map(u -> User.withUsername(u.getUsername())
        .password(u.getPassword())
        .roles("USER")
        .build())
      .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  public DaoAuthenticationProvider authProvider(UserDetailsService uds, PasswordEncoder encoder) {
    DaoAuthenticationProvider p = new DaoAuthenticationProvider();
    p.setUserDetailsService(uds);
    p.setPasswordEncoder(encoder);
    return p;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico").permitAll()
        .requestMatchers("/api/register", "/api/login", "/api/logout", "/api/dashboard/**").permitAll()
        .requestMatchers("/ws/**").permitAll()
        .anyRequest().permitAll()
      )
      .sessionManagement(Customizer.withDefaults())
      .httpBasic(Customizer.withDefaults());
    return http.build();
  }
}
