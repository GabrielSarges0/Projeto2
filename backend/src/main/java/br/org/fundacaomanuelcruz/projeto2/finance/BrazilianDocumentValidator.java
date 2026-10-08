package br.org.fundacaomanuelcruz.projeto2.finance;

import org.springframework.stereotype.Component;

@Component
public class BrazilianDocumentValidator {

    public String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public boolean isValid(BrazilianDocumentType type, String value) {
        String digits = normalize(value);
        if (type == null || digits.chars().distinct().count() == 1) {
            return false;
        }
        return switch (type) {
            case CPF -> isValidCpf(digits);
            case CNPJ -> isValidCnpj(digits);
        };
    }

    private boolean isValidCpf(String digits) {
        if (digits.length() != 11) {
            return false;
        }

        int first = cpfDigit(digits, 9, 10);
        int second = cpfDigit(digits, 10, 11);
        return first == digitAt(digits, 9) && second == digitAt(digits, 10);
    }

    private int cpfDigit(String digits, int length, int initialWeight) {
        int sum = 0;
        for (int index = 0; index < length; index++) {
            sum += digitAt(digits, index) * (initialWeight - index);
        }
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }

    private boolean isValidCnpj(String digits) {
        if (digits.length() != 14) {
            return false;
        }

        int first = cnpjDigit(digits, 12, new int[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 });
        int second = cnpjDigit(digits, 13, new int[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 });
        return first == digitAt(digits, 12) && second == digitAt(digits, 13);
    }

    private int cnpjDigit(String digits, int length, int[] weights) {
        int sum = 0;
        for (int index = 0; index < length; index++) {
            sum += digitAt(digits, index) * weights[index];
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    private int digitAt(String digits, int index) {
        return digits.charAt(index) - '0';
    }
}
