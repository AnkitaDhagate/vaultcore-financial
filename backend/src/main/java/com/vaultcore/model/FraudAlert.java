package com.vaultcore.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_alerts")
@Data
@NoArgsConstructor
public class FraudAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "fraud_seq")
    @SequenceGenerator(name = "fraud_seq", sequenceName = "seq_fraud_alerts", allocationSize = 1)
    @Column(name = "alert_id")
    private Long alertId;
    
    @Column(name = "transaction_ref", length = 50)
    private String transactionRef;
    
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;
    
    private BigDecimal amount;
    
    @Column(name = "alert_type", length = 20)
    private String alertType;
    
    @Column(length = 10)
    private String severity;
    
    @Column(name = "two_factor_triggered")
    private Integer twoFactorTriggered = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}