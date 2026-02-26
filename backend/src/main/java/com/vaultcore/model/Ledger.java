package com.vaultcore.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_vault")
@Data
@NoArgsConstructor
public class Ledger {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ledger_seq")
    @SequenceGenerator(name = "ledger_seq", sequenceName = "seq_ledger_vault", allocationSize = 1)
    @Column(name = "ledger_id")
    private Long ledgerId;
    
    @Column(name = "transaction_uuid", nullable = false)
    private UUID transactionUuid = UUID.randomUUID();
    
    @Column(name = "transaction_ref", unique = true, nullable = false)
    private String transactionRef;
    
    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;
    
    @ManyToOne
    @JoinColumn(name = "contra_account_id")
    private Account contraAccount;
    
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;
    
    @Column(name = "entry_type", nullable = false, length = 6)
    private String entryType; // DEBIT or CREDIT
    
    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // TRANSFER, DEPOSIT, WITHDRAWAL
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 10)
    private String status = "COMPLETED";
    
    @Column(name = "fraud_flagged")
    private Integer fraudFlagged = 0;
    
    @Column(name = "two_factor_required")
    private Integer twoFactorRequired = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @PrePersist
    protected void onCreate() {
        if (transactionRef == null) {
            transactionRef = "TXN-" + LocalDateTime.now().toString().replaceAll("[-:T.]", "").substring(0, 14) 
                        + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }
    }
}