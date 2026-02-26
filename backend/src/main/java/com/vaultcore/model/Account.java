package com.vaultcore.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts_vault")
@Data
@NoArgsConstructor
public class Account {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "account_seq")
    @SequenceGenerator(name = "account_seq", sequenceName = "seq_accounts_vault", allocationSize = 1)
    @Column(name = "account_id")
    private Long accountId;
    
    @Column(name = "account_number", unique = true, nullable = false, length = 20)
    private String accountNumber;
    
    @Column(name = "account_name", nullable = false)
    private String accountName;
    
    @Column(name = "account_type", nullable = false)
    private String accountType;
    
    @Column(name = "account_category", nullable = false)
    private String accountCategory;
    
    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;
    
    @Column(length = 3)
    private String currency = "USD";
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(length = 10)
    private String status = "ACTIVE";
    
    @Version
    private Long version = 0L;
    
    @Column(name = "daily_transaction_limit")
    private BigDecimal dailyTransactionLimit = new BigDecimal("10000");
    
    @Column(name = "monthly_transaction_limit")
    private BigDecimal monthlyTransactionLimit = new BigDecimal("50000");
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}