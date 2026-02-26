package com.vaultcore.service;

import com.vaultcore.dto.TransactionResponse;
import com.vaultcore.dto.TransferRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import com.vaultcore.model.FraudAlert;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import com.vaultcore.repository.FraudAlertRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private LedgerRepository ledgerRepository;
    
    @Autowired
    private FraudAlertRepository fraudAlertRepository;
    
    @Autowired
    private TwoFactorService twoFactorService;
    
    @Value("${fraud.threshold}")
    private BigDecimal fraudThreshold;
    
    @Transactional(rollbackOn = Exception.class)
    public TransactionResponse transferFunds(TransferRequest request) throws Exception {
        
        // Lock both accounts with pessimistic locking
        Account fromAccount = accountRepository.findByIdForUpdate(request.getFromAccountId())
                .orElseThrow(() -> new Exception("Source account not found"));
        
        Account toAccount = accountRepository.findByIdForUpdate(request.getToAccountId())
                .orElseThrow(() -> new Exception("Destination account not found"));
        
        // Validation
        if (!"ACTIVE".equals(fromAccount.getStatus())) {
            throw new Exception("Source account is not active");
        }
        
        if (!"ACTIVE".equals(toAccount.getStatus())) {
            throw new Exception("Destination account is not active");
        }
        
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new Exception("Insufficient funds. Available: " + fromAccount.getBalance());
        }
        
        // Check daily limit
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        BigDecimal todayTotal = ledgerRepository.getTransactionSumSince(fromAccount.getAccountId(), startOfDay);
        if (todayTotal == null) todayTotal = BigDecimal.ZERO;
        
        if (todayTotal.add(request.getAmount()).compareTo(fromAccount.getDailyTransactionLimit()) > 0) {
            throw new Exception("Daily transaction limit exceeded");
        }
        
        // Update balances
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);
        
        // Create ledger entries (double-entry)
        UUID transactionUuid = UUID.randomUUID();
        String transactionRef = "TXN" + System.currentTimeMillis();
        
        // Debit entry (outgoing)
        Ledger debitEntry = new Ledger();
        debitEntry.setTransactionUuid(transactionUuid);
        debitEntry.setTransactionRef(transactionRef);
        debitEntry.setAccount(fromAccount);
        debitEntry.setContraAccount(toAccount);
        debitEntry.setAmount(request.getAmount());
        debitEntry.setEntryType("CREDIT"); // Asset decreases with credit
        debitEntry.setTransactionType("TRANSFER");
        debitEntry.setDescription(request.getDescription());
        debitEntry.setStatus("COMPLETED");
        debitEntry.setCreatedAt(LocalDateTime.now());
        
        // Credit entry (incoming)
        Ledger creditEntry = new Ledger();
        creditEntry.setTransactionUuid(transactionUuid);
        creditEntry.setTransactionRef(transactionRef + "-C");
        creditEntry.setAccount(toAccount);
        creditEntry.setContraAccount(fromAccount);
        creditEntry.setAmount(request.getAmount());
        creditEntry.setEntryType("DEBIT"); // Asset increases with debit
        creditEntry.setTransactionType("TRANSFER");
        creditEntry.setDescription("Received: " + request.getDescription());
        creditEntry.setStatus("COMPLETED");
        creditEntry.setCreatedAt(LocalDateTime.now());
        
        // Check for fraud
        if (request.getAmount().compareTo(fraudThreshold) > 0) {
            debitEntry.setFraudFlagged(1);
            creditEntry.setFraudFlagged(1);
            debitEntry.setTwoFactorRequired(1);
            creditEntry.setTwoFactorRequired(1);
            
            // Create fraud alert
            FraudAlert alert = new FraudAlert();
            alert.setAccount(fromAccount);
            alert.setAmount(request.getAmount());
            alert.setAlertType("HIGH_VALUE");
            alert.setSeverity("HIGH");
            alert.setTwoFactorTriggered(1);
            alert.setTransactionRef(transactionRef);
            fraudAlertRepository.save(alert);
            
            // Trigger 2FA
            twoFactorService.sendTwoFactorChallenge(fromAccount.getUser().getUserId());
        }
        
        ledgerRepository.save(debitEntry);
        ledgerRepository.save(creditEntry);
        
        // Prepare response
        TransactionResponse response = new TransactionResponse();
        response.setTransactionRef(transactionRef);
        response.setFromAccountNumber(fromAccount.getAccountNumber());
        response.setFromAccountName(fromAccount.getAccountName());
        response.setToAccountNumber(toAccount.getAccountNumber());
        response.setToAccountName(toAccount.getAccountName());
        response.setAmount(request.getAmount());
        response.setType("TRANSFER");
        response.setDescription(request.getDescription());
        response.setStatus("COMPLETED");
        response.setTimestamp(LocalDateTime.now());
        response.setFraudFlagged(debitEntry.getFraudFlagged() == 1);
        response.setTwoFactorRequired(debitEntry.getTwoFactorRequired() == 1);
        
        return response;
    }
    
    public List<Ledger> getRecentTransactions() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // Implement logic to get user's transactions
        return ledgerRepository.findAll().stream()
                .limit(50)
                .collect(java.util.stream.Collectors.toList());
    }
    
    public List<FraudAlert> getFraudAlerts() {
        return fraudAlertRepository.findAll();
    }
    
    // Week 2 Concurrency Test
    @Transactional
    public void concurrencyTest(Long accountId, int threads, BigDecimal amount) throws InterruptedException {
        Account account = accountRepository.findByIdForUpdate(accountId).orElseThrow();
        
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor();
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threads);
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    Account acc = accountRepository.findByIdForUpdate(accountId).orElseThrow();
                    if (acc.getBalance().compareTo(amount) >= 0) {
                        acc.setBalance(acc.getBalance().subtract(amount));
                        accountRepository.save(acc);
                    }
                } catch (Exception e) {
                    System.err.println("Thread failed: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }
        
        latch.await();
        executor.shutdown();
    }
}