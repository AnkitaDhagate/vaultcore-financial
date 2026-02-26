package com.vaultcore.controller;

import com.vaultcore.dto.TransactionResponse;
import com.vaultcore.dto.TransferRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import com.vaultcore.service.TransactionService;
import com.vaultcore.service.TwoFactorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;
    
    @Autowired
    private TwoFactorService twoFactorService;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private LedgerRepository ledgerRepository;
    
    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@Valid @RequestBody TransferRequest request) {
        try {
            // Check if 2FA is required and verified
            if (request.isTwoFactorVerified()) {
                boolean verified = twoFactorService.verifyCode(
                    accountRepository.findById(request.getFromAccountId()).get().getUser().getUserId(),
                    request.getDescription() // In real app, send code separately
                );
                if (!verified) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid 2FA code"));
                }
            }
            
            TransactionResponse response = transactionService.transferFunds(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        // Get last 50 transactions for the logged-in user's accounts
        List<Ledger> transactions = transactionService.getRecentTransactions();
        
        List<TransactionResponse> response = transactions.stream().map(t -> {
            TransactionResponse tr = new TransactionResponse();
            tr.setTransactionRef(t.getTransactionRef());
            tr.setFromAccountNumber(t.getAccount().getAccountNumber());
            tr.setFromAccountName(t.getAccount().getAccountName());
            tr.setToAccountNumber(t.getContraAccount() != null ? t.getContraAccount().getAccountNumber() : null);
            tr.setToAccountName(t.getContraAccount() != null ? t.getContraAccount().getAccountName() : null);
            tr.setAmount(t.getAmount());
            tr.setType(t.getTransactionType());
            tr.setDescription(t.getDescription());
            tr.setStatus(t.getStatus());
            tr.setTimestamp(t.getCreatedAt());
            tr.setFraudFlagged(t.getFraudFlagged() == 1);
            tr.setTwoFactorRequired(t.getTwoFactorRequired() == 1);
            return tr;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/fraud-alerts")
    public ResponseEntity<?> getFraudAlerts() {
        return ResponseEntity.ok(transactionService.getFraudAlerts());
    }
    
    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody Map<String, String> request) {
        Long userId = Long.parseLong(request.get("userId"));
        String code = request.get("code");
        
        boolean verified = twoFactorService.verifyCode(userId, code);
        return ResponseEntity.ok(Map.of("verified", verified));
    }
}