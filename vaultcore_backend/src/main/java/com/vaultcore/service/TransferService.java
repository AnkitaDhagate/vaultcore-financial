package com.vaultcore.service;

import com.vaultcore.dto.TransferRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransferService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private LedgerRepository ledgerRepository;

    @Autowired
    private FraudDetectionService fraudDetectionService;

    @Transactional
    public String transferMoney(TransferRequest request) throws Exception {
        // Check fraud
        if (fraudDetectionService.isSuspicious(request)) {
            throw new Exception("Transaction flagged as suspicious. 2FA required.");
        }

        // Get accounts with pessimistic lock
        Account fromAccount = accountRepository.findByAccountNumberWithLock(request.getFromAccount())
                .orElseThrow(() -> new Exception("Source account not found"));

        Account toAccount = accountRepository.findByAccountNumberWithLock(request.getToAccount())
                .orElseThrow(() -> new Exception("Destination account not found"));

        // Check balance
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new Exception("Insufficient balance");
        }

        // Update balances
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // Create ledger entry
        Ledger ledger = new Ledger();
        String transactionId = "TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ledger.setTransactionId(transactionId);
        ledger.setFromAccount(request.getFromAccount());
        ledger.setToAccount(request.getToAccount());
        ledger.setAmount(request.getAmount());
        ledger.setType("TRANSFER");
        ledger.setDescription(request.getDescription());
        ledger.setCreatedAt(LocalDateTime.now());

        ledgerRepository.save(ledger);

        return transactionId;
    }

    @Transactional
    public BigDecimal getBalance(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);
    }
}