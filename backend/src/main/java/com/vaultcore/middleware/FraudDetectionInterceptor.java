package com.vaultcore.middleware;

import com.vaultcore.dto.TransferRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.FraudAlert;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.FraudAlertRepository;
import com.vaultcore.service.TwoFactorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class FraudDetectionInterceptor implements HandlerInterceptor {
    
    @Value("${fraud.threshold}")
    private BigDecimal fraudThreshold;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private FraudAlertRepository fraudAlertRepository;
    
    @Autowired
    private TwoFactorService twoFactorService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) 
            throws Exception {
        
        if (request.getMethod().equals("POST") && request.getRequestURI().contains("/api/transactions/transfer")) {
            
            // Read request body
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            byte[] body = wrappedRequest.getContentAsByteArray();
            TransferRequest transferRequest = objectMapper.readValue(body, TransferRequest.class);
            
            // Check if amount exceeds threshold
            if (transferRequest.getAmount().compareTo(fraudThreshold) > 0) {
                
                Account account = accountRepository.findById(transferRequest.getFromAccountId()).orElse(null);
                
                if (account != null) {
                    // Create fraud alert
                    FraudAlert alert = new FraudAlert();
                    alert.setAccount(account);
                    alert.setAmount(transferRequest.getAmount());
                    alert.setAlertType("HIGH_VALUE");
                    alert.setSeverity("HIGH");
                    alert.setTwoFactorTriggered(1);
                    alert.setTransactionRef("PENDING-" + System.currentTimeMillis());
                    fraudAlertRepository.save(alert);
                    
                    // Trigger 2FA
                    twoFactorService.sendTwoFactorChallenge(account.getUser().getUserId());
                    
                    // Add header to indicate 2FA required
                    response.addHeader("X-2FA-Required", "true");
                }
            }
            
            // Check for unusual patterns (velocity check)
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            Long recentHighValueCount = fraudAlertRepository
                    .findByAccountAccountIdOrderByCreatedAtDesc(transferRequest.getFromAccountId())
                    .stream()
                    .filter(a -> a.getCreatedAt().isAfter(tenMinutesAgo))
                    .count();
            
            if (recentHighValueCount >= 3) {
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("{\"error\":\"Too many high-value transactions. Please try later.\"}");
                return false;
            }
        }
        
        return true;
    }
}