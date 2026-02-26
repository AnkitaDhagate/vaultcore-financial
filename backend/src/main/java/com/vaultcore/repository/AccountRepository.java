package com.vaultcore.repository;

import com.vaultcore.model.Account;
import com.vaultcore.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    List<Account> findByUser(User user);
    
    Optional<Account> findByAccountNumber(String accountNumber);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountId = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);
    
    @Query("SELECT SUM(a.balance) FROM Account a WHERE a.user.userId = :userId AND a.accountCategory = 'ASSET'")
    BigDecimal getTotalAssetsByUser(@Param("userId") Long userId);
}