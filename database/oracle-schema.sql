-- database/schema.sql
CREATE DATABASE IF NOT EXISTS vaultcore_db;
USE vaultcore_db;

-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT,
    account_type VARCHAR(20) DEFAULT 'SAVINGS',
    balance DECIMAL(19,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ledger table (immutable)
CREATE TABLE ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    from_account VARCHAR(20),
    to_account VARCHAR(20),
    amount DECIMAL(19,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (amount > 0)
);

-- Audit log table
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50),
    action VARCHAR(100),
    method VARCHAR(100),
    parameters TEXT,
    result TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO users (username, password, email, phone) VALUES 
('john_doe', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'john@example.com', '1234567890'),
('jane_smith', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'jane@example.com', '0987654321');

INSERT INTO accounts (account_number, user_id, account_type, balance) VALUES 
('ACC001', 1, 'SAVINGS', 5000.00),
('ACC002', 1, 'CHECKING', 2500.00),
('ACC003', 2, 'SAVINGS', 10000.00);
