package com.vaultcore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VaultcoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(VaultcoreApplication.class, args);
        System.out.println("🚀 VaultCore Financial Backend Started on Port 8080");
        System.out.println("📊 Week 1: Security & Ledger Design - Active");
        System.out.println("🔄 Week 2: Transaction Engine - Active");
    }
}