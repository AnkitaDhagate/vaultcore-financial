package com.vaultcore.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {
    private String transactionRef;
    private String fromAccountNumber;
    private String fromAccountName;
    private String toAccountNumber;
    private String toAccountName;
    private BigDecimal amount;
    private String type;
    private String description;
    private String status;
    private LocalDateTime timestamp;
    private boolean fraudFlagged;
    private boolean twoFactorRequired;
}