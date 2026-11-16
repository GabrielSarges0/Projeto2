package br.org.fundacaomanuelcruz.projeto2.user;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;
import br.org.fundacaomanuelcruz.projeto2.auth.AuthenticatedUser;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class UserService {

    private static final int MAX_PREFERENCES_CHARS = 4000;

    // Evita uma consulta ao banco por requisição; invalidado em toda alteração de conta.
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);
    private final Map<String, CachedUser> cache = new ConcurrentHashMap<>();

    private final AppUserRepository repository;
    private final ObjectMapper objectMapper;
    private final Set<String> managerEmails;
    /** Teste do MVP: toda conta ativa entra (e passa a ser) Gerente. Desligue com APP_ALL_MANAGERS=false. */
    private final boolean allManagers;

    public UserService(
            AppUserRepository repository,
            ObjectMapper objectMapper,
            @Value("${app.auth.manager-emails:}") String managerEmails,
            @Value("${app.auth.all-managers:false}") boolean allManagers) {
        this.allManagers = allManagers;
        this.repository = repository;
        this.objectMapper = objectMapper;
        Set<String> emails = Arrays.stream(managerEmails.split(","))
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toSet());
        emails.add("gabrielsarges1926@gmail.com");
        emails.add("hbsv@cesar.school");
        this.managerEmails = Collections.unmodifiableSet(emails);
    }

    /**
     * Login aberto: a conta é criada no primeiro acesso. Sem Gerente ativo (base nova), a primeira conta
     * vira Gerente para alguém poder distribuir os papéis; e-mails de APP_MANAGER_EMAILS entram como Gerente.
     */
    @Transactional
    public AppUser onLogin(String email, String providedName, String fallbackName) {
        AppUser user = repository.findById(email)
                .orElseGet(() -> save(new AppUser(email, providedName != null ? providedName : fallbackName, initialRole(email))));
        if (!user.isActive()) {
            throw new ForbiddenException("Conta desativada. Fale com o gerente da Fundação.");
        }
        if ((allManagers || managerEmails.contains(email)) && user.getRole() != UserRole.GERENTE) {
            user.setRole(UserRole.GERENTE);
        }
        // No login comum o nome salvo (talvez editado no Perfil) é mantido; no cadastro, vale o informado.
        if (providedName != null) {
            user.setDisplayName(providedName);
        }
        user.touchLogin();
        return save(user);
    }

    @Transactional(readOnly = true)
    public Optional<AuthenticatedUser> resolveActive(String email) {
        Instant now = Instant.now();
        CachedUser cached = cache.get(email);
        if (cached != null && now.isBefore(cached.expiresAt())) {
            return cached.user();
        }
        Optional<AuthenticatedUser> user = findActive(email)
                // Com o modo de teste ligado, quem já estava logado como Funcionário também passa a valer como Gerente.
                .map(found -> new AuthenticatedUser(found.getEmail(), found.getDisplayName(), allManagers ? UserRole.GERENTE : found.getRole()));
        if (cache.size() > 5_000) cache.clear();
        cache.put(email, new CachedUser(user, now.plus(CACHE_TTL)));
        return user;
    }

    @Transactional(readOnly = true)
    public Optional<AppUser> findActive(String email) {
        return repository.findById(email).filter(AppUser::isActive);
    }

    @Transactional
    public AppUser rename(String email, String displayName) {
        AppUser user = find(email);
        user.setDisplayName(displayName);
        return save(user);
    }

    @Transactional
    public AppUser savePreferences(String email, JsonNode preferences) {
        if (preferences == null || !preferences.isObject()) {
            throw new IllegalArgumentException("Preferências devem ser um objeto JSON.");
        }
        String json = objectMapper.writeValueAsString(preferences);
        if (json.length() > MAX_PREFERENCES_CHARS) {
            throw new IllegalArgumentException("Preferências grandes demais.");
        }
        AppUser user = find(email);
        user.setPreferences(json);
        return save(user);
    }

    public JsonNode preferencesOf(AppUser user) {
        return objectMapper.readTree(user.getPreferences());
    }

    @Transactional(readOnly = true)
    public List<AppUser> listAll() {
        return repository.findAllByOrderByActiveDescDisplayNameAsc();
    }

    @Transactional
    public AppUser changeRole(String actorEmail, String email, UserRole role) {
        AppUser user = find(email);
        if (actorEmail.equals(user.getEmail()) && role != UserRole.GERENTE) {
            throw new IllegalArgumentException("Você não pode tirar o seu próprio papel de Gerente.");
        }
        if (user.getRole() == UserRole.GERENTE && role != UserRole.GERENTE) {
            requireAnotherActiveManager(user);
        }
        user.setRole(role);
        return save(user);
    }

    @Transactional
    public AppUser changeActive(String actorEmail, String email, boolean active) {
        AppUser user = find(email);
        if (!active && actorEmail.equals(user.getEmail())) {
            throw new IllegalArgumentException("Você não pode desativar a sua própria conta.");
        }
        if (!active && user.getRole() == UserRole.GERENTE) {
            requireAnotherActiveManager(user);
        }
        user.setActive(active);
        return save(user);
    }

    private AppUser save(AppUser user) {
        AppUser saved = repository.save(user);
        cache.remove(saved.getEmail());
        return saved;
    }

    private record CachedUser(Optional<AuthenticatedUser> user, Instant expiresAt) {
    }

    private void requireAnotherActiveManager(AppUser user) {
        long managers = repository.countByRoleAndActiveTrue(UserRole.GERENTE);
        if (managers <= 1 && user.isActive()) {
            throw new IllegalArgumentException("A Fundação precisa de ao menos um Gerente ativo.");
        }
    }

    private UserRole initialRole(String email) {
        if (managerEmails.contains(email) || repository.countByRoleAndActiveTrue(UserRole.GERENTE) == 0) {
            return UserRole.GERENTE;
        }
        return UserRole.FUNCIONARIO;
    }

    private AppUser find(String email) {
        return repository.findById(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado: " + email));
    }
}
