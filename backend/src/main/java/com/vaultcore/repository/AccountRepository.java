package com.vaultcore.repository;

import com.vaultcore.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserId(Long userId);
    Optional<Account> findByAccountNumber(String accountNumber);
    Optional<Account> findByUserIdAndAccountType(Long userId, String accountType);
}
