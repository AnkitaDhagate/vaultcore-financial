package com.vaultcore.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AccountResponse {
    private Long accountId;
    private String accountNumber;
    private String accountName;
    private String accountType;
    private String accountCategory;
    private BigDecimal balance;
    private String currency;
    private String status;
    private BigDecimal dailyTransactionLimit;
    private BigDecimal monthlyTransactionLimit;
    private Integer todayTransactionCount;
    private BigDecimal todayTotalAmount;
}