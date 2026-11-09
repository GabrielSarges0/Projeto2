package br.org.fundacaomanuelcruz.projeto2.user;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, String> {
    long countByRoleAndActiveTrue(UserRole role);

    List<AppUser> findAllByOrderByActiveDescDisplayNameAsc();
}
