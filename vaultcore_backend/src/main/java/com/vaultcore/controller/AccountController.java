package com.vaultcore.controller;

import com.vaultcore.model.Account;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransferService transferService;

    // GET /api/accounts/user/{userId} — logged-in user's own accounts
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Account>> getUserAccounts(@PathVariable Long userId) {
        return ResponseEntity.ok(accountRepository.findByUserId(userId));
    }

    // ✅ NEW: GET /api/accounts/others/{userId} — all accounts except the logged-in user
    // Used in Transfer page "To Account" dropdown to show all possible recipients
    @GetMapping("/others/{userId}")
    public ResponseEntity<List<Account>> getOtherAccounts(@PathVariable Long userId) {
        return ResponseEntity.ok(accountRepository.findAllExceptUser(userId));
    }

    // GET /api/accounts/{accountNumber}/balance
    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<BigDecimal> getBalance(@PathVariable String accountNumber) {
        return ResponseEntity.ok(transferService.getBalance(accountNumber));
    }

    // GET /api/accounts/{accountNumber}
    @GetMapping("/{accountNumber}")
    public ResponseEntity<Account> getAccount(@PathVariable String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
