package com.vaultcore.service;

import com.vaultcore.model.User;
import com.vaultcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class TwoFactorService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SmsService smsService;
    
    public String generateAndSendCode(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;
        
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // Store code in cache/session (simplified - use Redis in production)
        TwoFactorCache.storeCode(userId, code);
        
        // Send via email (mock)
        emailService.sendTwoFactorCode(user.getEmail(), code);
        
        // Send via SMS if phone number exists (mock)
        if (user.getPhoneNumber() != null) {
            smsService.sendTwoFactorCode(user.getPhoneNumber(), code);
        }
        
        return code;
    }
    
    public boolean verifyCode(Long userId, String code) {
        String storedCode = TwoFactorCache.getCode(userId);
        return storedCode != null && storedCode.equals(code);
    }
    
    public void sendTwoFactorChallenge(Long userId) {
        generateAndSendCode(userId);
    }
}

// Simplified cache - use Redis in production
class TwoFactorCache {
    private static java.util.Map<Long, String> codeMap = new java.util.concurrent.ConcurrentHashMap<>();
    private static java.util.Map<Long, Long> expiryMap = new java.util.concurrent.ConcurrentHashMap<>();
    
    public static void storeCode(Long userId, String code) {
        codeMap.put(userId, code);
        expiryMap.put(userId, System.currentTimeMillis() + 300000); // 5 minutes
    }
    
    public static String getCode(Long userId) {
        Long expiry = expiryMap.get(userId);
        if (expiry == null || expiry < System.currentTimeMillis()) {
            codeMap.remove(userId);
            expiryMap.remove(userId);
            return null;
        }
        return codeMap.get(userId);
    }
}