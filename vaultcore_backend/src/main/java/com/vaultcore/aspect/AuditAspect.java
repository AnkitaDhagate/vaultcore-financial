package com.vaultcore.aspect;

import com.vaultcore.model.AuditLog;
import com.vaultcore.repository.AuditLogRepository;
import com.vaultcore.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;

@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Pointcut("@within(org.springframework.web.bind.annotation.RestController)")
    public void controllerMethods() {}

    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logAfterMethod(JoinPoint joinPoint, Object result) {
        try {
            AuditLog auditLog = new AuditLog();

            // Get username
            Object principal = SecurityContextHolder.getContext().getAuthentication() != null ?
                    SecurityContextHolder.getContext().getAuthentication().getPrincipal() : null;

            if (principal instanceof CustomUserDetails) {
                auditLog.setUsername(((CustomUserDetails) principal).getUsername());
            } else if (principal instanceof String) {
                auditLog.setUsername((String) principal);
            } else {
                auditLog.setUsername("anonymous");
            }

            // Get IP address
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                auditLog.setIpAddress(request.getRemoteAddr());
                auditLog.setAction(request.getMethod() + " " + request.getRequestURI());
            }

            auditLog.setMethod(joinPoint.getSignature().toShortString());
            auditLog.setParameters(Arrays.toString(joinPoint.getArgs()));
            auditLog.setResult(result != null ? result.toString() : "null");
            auditLog.setCreatedAt(LocalDateTime.now());

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            // Log error but don't break the application
            System.err.println("Failed to save audit log: " + e.getMessage());
        }
    }
}