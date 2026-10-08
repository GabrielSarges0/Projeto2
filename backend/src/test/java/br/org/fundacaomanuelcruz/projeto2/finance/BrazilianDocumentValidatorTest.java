package br.org.fundacaomanuelcruz.projeto2.finance;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class BrazilianDocumentValidatorTest {

    private final BrazilianDocumentValidator validator = new BrazilianDocumentValidator();

    @Test
    void validatesCpf() {
        assertTrue(validator.isValid(BrazilianDocumentType.CPF, "529.982.247-25"));
        assertFalse(validator.isValid(BrazilianDocumentType.CPF, "111.111.111-11"));
    }

    @Test
    void validatesCnpj() {
        assertTrue(validator.isValid(BrazilianDocumentType.CNPJ, "11.222.333/0001-81"));
        assertFalse(validator.isValid(BrazilianDocumentType.CNPJ, "11.111.111/1111-11"));
    }
}
