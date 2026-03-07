package com.vaultcore.repository;

import com.vaultcore.model.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * ✅ READ-ONLY by design — no save/delete methods exposed beyond JpaRepository.
 * Actual saves happen ONLY inside TransferService within @Transactional(SERIALIZABLE).
 */
public interface LedgerRepository extends JpaRepository<Ledger, Long> {

    // All entries for an account — used for transaction history
    @Query("SELECT l FROM Ledger l WHERE l.accountRef = :accountRef ORDER BY l.createdAt DESC")
    List<Ledger> findByAccountRefOrderByCreatedAtDesc(@Param("accountRef") String accountRef);

    // All entries for a transaction (both DEBIT + CREDIT)
    List<Ledger> findByTransactionIdOrderByCreatedAtAsc(String transactionId);

    // Both sides — used for statement generation
    @Query("SELECT l FROM Ledger l WHERE l.accountRef = :acc OR l.counterpartAccount = :acc ORDER BY l.createdAt DESC")
    List<Ledger> findAllRelatedToAccount(@Param("acc") String accountRef);
}
