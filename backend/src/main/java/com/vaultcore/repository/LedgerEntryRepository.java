package com.vaultcore.repository;

import com.vaultcore.model.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByTransactionId(String transactionId);
    List<LedgerEntry> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM LedgerEntry l " +
           "WHERE l.accountId = :accountId AND l.direction = 'DEBIT'")
    BigDecimal getTotalDebits(@Param("accountId") Long accountId);
    
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM LedgerEntry l " +
           "WHERE l.accountId = :accountId AND l.direction = 'CREDIT'")
    BigDecimal getTotalCredits(@Param("accountId") Long accountId);
}