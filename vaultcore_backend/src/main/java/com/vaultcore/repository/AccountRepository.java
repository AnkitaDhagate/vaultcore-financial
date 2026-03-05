package com.vaultcore.repository;

import com.vaultcore.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    // ✅ FIX: Account has @ManyToOne User user — so the correct JPQL is user.id not userId
    // Old: findByUserId(Long userId)  → generated query: WHERE user_id = ?  (works at DB level)
    // But safer to be explicit with the join:
    @Query("SELECT a FROM Account a WHERE a.user.id = :userId")
    List<Account> findByUserId(@Param("userId") Long userId);

    // Find all accounts EXCEPT those belonging to a specific user (for "To Account" dropdown)
    @Query("SELECT a FROM Account a WHERE a.user.id != :userId")
    List<Account> findAllExceptUser(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithLock(@Param("accountNumber") String accountNumber);
}
