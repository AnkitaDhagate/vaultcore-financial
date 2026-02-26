package com.vaultcore.controller;

import com.vaultcore.dto.AccountResponse;
import com.vaultcore.model.Account;
import com.vaultcore.model.User;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import com.vaultcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountController {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LedgerRepository ledgerRepository;
    
    @GetMapping
    public ResponseEntity<?> getMyAccounts() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        
        List<Account> accounts = accountRepository.findByUser(user);
        
        List<AccountResponse> response = accounts.stream().map(account -> {
            AccountResponse ar = new AccountResponse();
            ar.setAccountId(account.getAccountId());
            ar.setAccountNumber(account.getAccountNumber());
            ar.setAccountName(account.getAccountName());
            ar.setAccountType(account.getAccountType());
            ar.setAccountCategory(account.getAccountCategory());
            ar.setBalance(account.getBalance());
            ar.setCurrency(account.getCurrency());
            ar.setStatus(account.getStatus());
            ar.setDailyTransactionLimit(account.getDailyTransactionLimit());
            ar.setMonthlyTransactionLimit(account.getMonthlyTransactionLimit());
            
            // Today's transaction count
            Integer todayCount = ledgerRepository.getTodayTransactionCount(account.getAccountId());
            ar.setTodayTransactionCount(todayCount != null ? todayCount : 0);
            
            // Today's total amount
            BigDecimal todayTotal = ledgerRepository.getTransactionSumSince(
                account.getAccountId(), LocalDateTime.now().withHour(0).withMinute(0).withSecond(0)
            );
            ar.setTodayTotalAmount(todayTotal != null ? todayTotal : BigDecimal.ZERO);
            
            return ar;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getAccount(@PathVariable Long id) {
        Account account = accountRepository.findById(id).orElse(null);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(account);
    }
    
    @GetMapping("/balance/{id}")
    public ResponseEntity<?> getBalance(@PathVariable Long id) {
        // Virtual Threads implementation - Java 21
        Thread.startVirtualThread(() -> {
            System.out.println("🔄 Virtual Thread processing balance for account: " + id);
        });
        
        Account account = accountRepository.findById(id).orElse(null);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(Map.of(
            "accountId", account.getAccountId(),
            "accountNumber", account.getAccountNumber(),
            "balance", account.getBalance(),
            "currency", account.getCurrency()
        ));
    }
}