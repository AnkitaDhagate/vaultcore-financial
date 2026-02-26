package com.vaultcore.service;

import org.springframework.stereotype.Service;

@Service
public class SmsService {
    
    public void sendTwoFactorCode(String phoneNumber, String code) {
        // Mock SMS sending
        System.out.println("📱 MOCK SMS to: " + phoneNumber);
        System.out.println("Your VaultCore 2FA code is: " + code);
        
        // In production, use Twilio or similar
        /*
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message.creator(
            new PhoneNumber(phoneNumber),
            new PhoneNumber(TWILIO_PHONE_NUMBER),
            "Your VaultCore 2FA code is: " + code
        ).create();
        */
    }
}