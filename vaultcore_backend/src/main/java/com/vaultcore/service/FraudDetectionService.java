package com.vaultcore.service;

import com.vaultcore.dto.TransferRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class FraudDetectionService {

    @Value("${fraud.threshold:10000}")
    private BigDecimal fraudThreshold;

    public boolean isSuspicious(TransferRequest request) {
        // Check if amount exceeds threshold
        if (request.getAmount().compareTo(fraudThreshold) > 0) {
            return true;
        }

        // Add more fraud detection logic here
        // - Check for unusual patterns
        // - Check for multiple transactions
        // - Check location anomalies

        return false;
    }
}