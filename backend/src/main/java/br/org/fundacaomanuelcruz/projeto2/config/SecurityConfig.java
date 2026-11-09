package br.org.fundacaomanuelcruz.projeto2.config;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

import br.org.fundacaomanuelcruz.projeto2.auth.BearerTokenAuthenticationFilter;
import br.org.fundacaomanuelcruz.projeto2.auth.SessionTokenService;
import br.org.fundacaomanuelcruz.projeto2.user.UserService;

@Configuration
public class SecurityConfig {

    // Papéis: GERENTE (tudo), ADMINISTRADOR (edita os módulos), FUNCIONARIO (leitura + operações do dia a dia).
    // ADMIN é o usuário técnico por HTTP Basic (scripts) e vale como Gerente.
    private static final String[] MANAGERS = { "GERENTE", "ADMIN" };
    private static final String[] EDITORS = { "GERENTE", "ADMINISTRADOR", "ADMIN" };

    /** Coleções que o funcionário também grava (regras finas em RecordService). */
    private static final String[] STAFF_RECORDS = {
            "/api/v1/records/attendance/**",
            "/api/v1/records/justifications/**",
            "/api/v1/records/inventory/**",
            "/api/v1/records/inventory-movements/**",
            "/api/v1/records/documents/**",
            "/api/v1/records/document-files/**",
    };

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SessionTokenService tokenService, UserService userService)
            throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/**").authenticated()
                        .requestMatchers("/api/v1/users/**").hasAnyRole(MANAGERS)
                        .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, STAFF_RECORDS).authenticated()
                        .requestMatchers("/api/**").hasAnyRole(EDITORS)
                        .anyRequest().authenticated())
                .addFilterBefore(new BearerTokenAuthenticationFilter(tokenService, userService), BasicAuthenticationFilter.class)
                .exceptionHandling(handling -> handling.accessDeniedHandler(jsonAccessDenied()))
                // Basic continua para o usuário técnico (APP_ADMIN_*); o painel usa o token do /login.
                // 401 sem "WWW-Authenticate" para o navegador não abrir a janela nativa de login: quem pede a senha é a tela /login do frontend.
                .httpBasic(basic -> basic.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .build();
    }

    private static AccessDeniedHandler jsonAccessDenied() {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":403,\"message\":\"Seu perfil não tem permissão para esta ação. Fale com o gerente.\",\"fieldErrors\":{}}");
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder,
            @Value("${app.auth.username}") String username,
            @Value("${app.auth.password}") String password) {
        if (username.isBlank() || password.length() < 8) {
            throw new IllegalStateException("Configure APP_ADMIN_USER e APP_ADMIN_PASSWORD (mínimo de 8 caracteres).");
        }
        return new InMemoryUserDetailsManager(User.withUsername(username)
                .password(passwordEncoder.encode(password))
                .roles("ADMIN")
                .build());
    }
}
