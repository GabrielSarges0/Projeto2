package br.org.fundacaomanuelcruz.projeto2.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    /** Relógio injetável: o ponto é gravado com a hora do servidor, e os testes controlam o horário. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
