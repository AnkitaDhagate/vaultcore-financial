package com.vaultcore.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    public void sendTwoFactorCode(String email, String code) {
        // Mock email sending
        System.out.println("📧 MOCK EMAIL to: " + email);
        System.out.println("Your 2FA code is: " + code);
        System.out.println("This code will expire in 5 minutes.");
        
        // In production, use JavaMailSender
        /*
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("VaultCore - Your 2FA Code");
        message.setText("Your verification code is: " + code + "\nThis code expires in 5 minutes.");
        mailSender.send(message);
        */
    }
}