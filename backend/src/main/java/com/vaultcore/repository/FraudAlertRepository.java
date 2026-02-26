package com.vaultcore.repository;

import com.vaultcore.model.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByAccountAccountIdOrderByCreatedAtDesc(Long accountId);
    List<FraudAlert> findByTwoFactorTriggered(Integer twoFactorTriggered);
}