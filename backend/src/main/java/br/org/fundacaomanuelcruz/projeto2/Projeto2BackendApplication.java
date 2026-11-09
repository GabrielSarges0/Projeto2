package br.org.fundacaomanuelcruz.projeto2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Projeto2BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(Projeto2BackendApplication.class, args);
	}

}
