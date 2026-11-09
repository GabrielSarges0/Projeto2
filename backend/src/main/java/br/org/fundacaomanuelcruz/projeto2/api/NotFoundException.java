package br.org.fundacaomanuelcruz.projeto2.api;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
