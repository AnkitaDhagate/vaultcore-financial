package com.vaultcore.repository;

import com.vaultcore.model.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LedgerRepository extends JpaRepository<Ledger, Long> {
    List<Ledger> findByFromAccountOrToAccountOrderByCreatedAtDesc(String fromAccount, String toAccount);
}