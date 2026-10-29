package br.org.fundacaomanuelcruz.projeto2.auth;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @GetMapping("/me")
    public CurrentUserResponse me(Principal principal) {
        return new CurrentUserResponse(principal.getName());
    }

    public record CurrentUserResponse(String username) {
    }
}
