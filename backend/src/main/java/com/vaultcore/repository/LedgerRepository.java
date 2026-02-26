package com.vaultcore.repository;

import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerRepository extends JpaRepository<Ledger, Long> {
    
    List<Ledger> findByAccount(Account account);
    
    List<Ledger> findByTransactionUuid(UUID transactionUuid);
    
    @Query("SELECT l FROM Ledger l WHERE l.account.accountId = :accountId AND l.createdAt >= :startDate")
    List<Ledger> findRecentByAccount(@Param("accountId") Long accountId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT SUM(l.amount) FROM Ledger l WHERE l.account.accountId = :accountId AND l.createdAt >= :startDate")
    BigDecimal getTransactionSumSince(@Param("accountId") Long accountId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(l) FROM Ledger l WHERE l.account.accountId = :accountId AND TRUNC(l.createdAt) = TRUNC(CURRENT_DATE)")
    Integer getTodayTransactionCount(@Param("accountId") Long accountId);
}