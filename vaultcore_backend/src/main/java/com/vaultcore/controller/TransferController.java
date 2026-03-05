package com.vaultcore.controller;

import com.vaultcore.dto.TransferRequest;
import com.vaultcore.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transfers")
@CrossOrigin(origins = "")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @PostMapping
    public ResponseEntity<?> transferMoney(@RequestBody TransferRequest request) {
        try {
            String transactionId = transferService.transferMoney(request);
            return ResponseEntity.ok("Transfer successful. Transaction ID: " + transactionId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Transfer failed: " + e.getMessage());
        }
    }
}