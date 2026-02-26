--Create User
CREATE USER vaultcore_user IDENTIFIED BY VaultCore123

GRANT CONNECT, RESOURCE TO vaultcore_user;

-- =====================================================
-- CREATE SEQUENCES
-- =====================================================

CREATE SEQUENCE seq_users_vault
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE SEQUENCE seq_accounts_vault
START WITH 1000
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE SEQUENCE seq_ledger_vault
START WITH 1000000
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE SEQUENCE seq_refresh_tokens_vault
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE SEQUENCE seq_transaction_vault
START WITH 1000
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE SEQUENCE seq_audit_vault
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

-- =====================================================
-- CORE TABLES (Week 1 - Security & Ledger Design)
-- =====================================================
-- Create Users Table
CREATE TABLE users_vault (
    user_id NUMBER PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    full_name VARCHAR2(100) NOT NULL,
    phone_number VARCHAR2(20),
    two_factor_enabled NUMBER(1) DEFAULT 0 CHECK (two_factor_enabled IN (0, 1)),
    account_non_locked NUMBER(1) DEFAULT 1 CHECK (account_non_locked IN (0, 1)),
    failed_attempts NUMBER DEFAULT 0,
    lock_time TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_last_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_expiry_days NUMBER DEFAULT 90,
    CONSTRAINT chk_email_format CHECK (REGEXP_LIKE(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3)
);

-- Trigger for users_vault auto-increment
CREATE OR REPLACE TRIGGER trg_users_vault_bi
BEFORE INSERT ON users_vault
FOR EACH ROW
BEGIN
    IF :NEW.user_id IS NULL THEN
        SELECT seq_users_vault.NEXTVAL INTO :NEW.user_id FROM DUAL;
    END IF;
END;
/

-- =====================================================
-- CREATE ACCOUNTS TABLE
-- =====================================================
CREATE TABLE accounts_vault (
    account_id NUMBER PRIMARY KEY,
    account_number VARCHAR2(20) UNIQUE NOT NULL,
    account_name VARCHAR2(100) NOT NULL,
    account_type VARCHAR2(20) NOT NULL,
    account_category VARCHAR2(20) NOT NULL,
    balance NUMBER(19,4) DEFAULT 0 NOT NULL,
    currency VARCHAR2(3) DEFAULT 'USD' NOT NULL,
    user_id NUMBER NOT NULL,
    status VARCHAR2(10) DEFAULT 'ACTIVE',
    version NUMBER DEFAULT 0 NOT NULL,
    daily_transaction_limit NUMBER(19,4) DEFAULT 10000,
    monthly_transaction_limit NUMBER(19,4) DEFAULT 50000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users_vault(user_id),
    CONSTRAINT chk_account_category CHECK (account_category IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
    CONSTRAINT chk_currency CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'INR')),
    CONSTRAINT chk_account_status CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    CONSTRAINT chk_balance_non_negative CHECK (
        (account_category = 'ASSET' AND balance >= 0) OR
        (account_category != 'ASSET')
    )
);

-- Trigger for accounts_vault auto-increment
CREATE OR REPLACE TRIGGER trg_accounts_vault_bi
BEFORE INSERT ON accounts_vault
FOR EACH ROW
BEGIN
    IF :NEW.account_id IS NULL THEN
        SELECT seq_accounts_vault.NEXTVAL INTO :NEW.account_id FROM DUAL;
    END IF;
    
    -- Generate account number if not provided
    IF :NEW.account_number IS NULL THEN
        :NEW.account_number := 'ACC-' || TO_CHAR(SYSDATE, 'YYYYMM') || '-' || LPAD(seq_accounts_vault.CURRVAL, 6, '0');
    END IF;
END;
/

-- =====================================================
-- CREATE LEDGER TABLE (IMMUTABLE - APPEND ONLY)
-- =====================================================

CREATE TABLE ledger_vault (
    ledger_id NUMBER PRIMARY KEY,
    transaction_uuid RAW(16) DEFAULT SYS_GUID() NOT NULL,
    transaction_ref VARCHAR2(50) UNIQUE NOT NULL,
    account_id NUMBER NOT NULL,
    contra_account_id NUMBER,
    amount NUMBER(19,4) NOT NULL,
    entry_type VARCHAR2(6) NOT NULL,
    transaction_type VARCHAR2(30) NOT NULL,
    description VARCHAR2(500),
    status VARCHAR2(10) DEFAULT 'COMPLETED',
    metadata CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR2(50),
    ip_address VARCHAR2(45),
    user_agent VARCHAR2(500),
    CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES accounts_vault(account_id),
    CONSTRAINT fk_ledger_contra_account FOREIGN KEY (contra_account_id) REFERENCES accounts_vault(account_id),
    CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_accounts_distinct CHECK (account_id <> contra_account_id),
    CONSTRAINT chk_entry_type CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_ledger_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'))
);

-- Trigger for ledger_vault auto-increment
CREATE OR REPLACE TRIGGER trg_ledger_vault_bi
BEFORE INSERT ON ledger_vault
FOR EACH ROW
BEGIN
    IF :NEW.ledger_id IS NULL THEN
        SELECT seq_ledger_vault.NEXTVAL INTO :NEW.ledger_id FROM DUAL;
    END IF;
    
    IF :NEW.transaction_ref IS NULL THEN
        :NEW.transaction_ref := 'TXN-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDD') || '-' || seq_transaction_vault.NEXTVAL;
    END IF;
    
    IF :NEW.created_by IS NULL THEN
        :NEW.created_by := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), 'SYSTEM');
    END IF;
END;
/

-- Trigger to prevent updates/deletes on ledger (Enforce Immutability)
CREATE OR REPLACE TRIGGER trg_ledger_immutable
BEFORE UPDATE OR DELETE ON ledger_vault
FOR EACH ROW
BEGIN
    RAISE_APPLICATION_ERROR(-20001, 'Ledger entries are immutable and cannot be modified or deleted');
END;
/

-- Trigger to update account balance
CREATE OR REPLACE TRIGGER trg_update_account_balance
AFTER INSERT ON ledger_vault
FOR EACH ROW
DECLARE
    v_account_category VARCHAR2(20);
BEGIN
    -- Get account category
    SELECT account_category INTO v_account_category
    FROM accounts_vault
    WHERE account_id = :NEW.account_id;
    
    -- Update balance based on entry type and account category
    IF :NEW.entry_type = 'DEBIT' THEN
        -- Debit increases ASSET/EXPENSE, decreases LIABILITY/EQUITY/INCOME
        IF v_account_category IN ('ASSET', 'EXPENSE') THEN
            UPDATE accounts_vault 
            SET balance = balance + :NEW.amount,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
            WHERE account_id = :NEW.account_id;
        ELSE
        UPDATE accounts_vault 
            SET balance = balance - :NEW.amount,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
            WHERE account_id = :NEW.account_id;
        END IF;
    ELSE -- CREDIT
        -- Credit decreases ASSET/EXPENSE, increases LIABILITY/EQUITY/INCOME
        IF v_account_category IN ('ASSET', 'EXPENSE') THEN
            UPDATE accounts_vault 
            SET balance = balance - :NEW.amount,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
            WHERE account_id = :NEW.account_id;
        ELSE
            UPDATE accounts_vault 
            SET balance = balance + :NEW.amount,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
            WHERE account_id = :NEW.account_id;
        END IF;
    END IF;
END;
/


-- =====================================================
-- CREATE REFRESH TOKENS TABLE (for JWT)
-- =====================================================

CREATE TABLE refresh_tokens_vault (
    token_id NUMBER PRIMARY KEY,
    user_id NUMBER NOT NULL,
    token VARCHAR2(512) UNIQUE NOT NULL,
    device_info VARCHAR2(500),
    ip_address VARCHAR2(45),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked NUMBER(1) DEFAULT 0,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users_vault(user_id),
    CONSTRAINT chk_revoked CHECK (revoked IN (0, 1))
);

-- Trigger for refresh_tokens_vault auto-increment
CREATE OR REPLACE TRIGGER trg_refresh_tokens_vault_bi
BEFORE INSERT ON refresh_tokens_vault
FOR EACH ROW
BEGIN
    IF :NEW.token_id IS NULL THEN
        SELECT seq_refresh_tokens_vault.NEXTVAL INTO :NEW.token_id FROM DUAL;
    END IF;
END;
/

-- =====================================================
-- CREATE AUDIT LOG TABLE
-- =====================================================

CREATE TABLE audit_log_vault (
    audit_id NUMBER PRIMARY KEY,
    table_name VARCHAR2(50) NOT NULL,
    record_id NUMBER,
    action VARCHAR2(10) NOT NULL,
    old_value CLOB,
    new_value CLOB,
    username VARCHAR2(50),
    ip_address VARCHAR2(45),
    user_agent VARCHAR2(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT'))
);

-- Trigger for audit_log_vault auto-increment
CREATE OR REPLACE TRIGGER trg_audit_log_vault_bi
BEFORE INSERT ON audit_log_vault
FOR EACH ROW
BEGIN
    IF :NEW.audit_id IS NULL THEN
        SELECT seq_audit_vault.NEXTVAL INTO :NEW.audit_id FROM DUAL;
    END IF;
END;
/

-- =====================================================
-- CREATE INDEXES WITH ERROR HANDLING
-- =====================================================

-- Check and create indexes only if they don't exist
DECLARE
    v_count NUMBER;
BEGIN
    -- For ledger_vault indexes
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_LEDGER_TXN_UUID';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_ledger_txn_uuid ON ledger_vault(transaction_uuid)';
        DBMS_OUTPUT.PUT_LINE('Created idx_ledger_txn_uuid');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_ledger_txn_uuid already exists');
    END IF;
    
    -- Skip idx_ledger_txn_ref as transaction_ref has UNIQUE constraint (index already exists)
    DBMS_OUTPUT.PUT_LINE('Skipping idx_ledger_txn_ref - covered by UNIQUE constraint');
    
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_LEDGER_ACCOUNT_DATE';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_ledger_account_date ON ledger_vault(account_id, created_at DESC)';
        DBMS_OUTPUT.PUT_LINE('Created idx_ledger_account_date');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_ledger_account_date already exists');
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_LEDGER_CONTRA_ACCOUNT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_ledger_contra_account ON ledger_vault(contra_account_id)';
        DBMS_OUTPUT.PUT_LINE('Created idx_ledger_contra_account');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_ledger_contra_account already exists');
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_LEDGER_CREATED_AT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_ledger_created_at ON ledger_vault(created_at)';
        DBMS_OUTPUT.PUT_LINE('Created idx_ledger_created_at');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_ledger_created_at already exists');
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_LEDGER_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_ledger_status ON ledger_vault(status)';
        DBMS_OUTPUT.PUT_LINE('Created idx_ledger_status');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_ledger_status already exists');
    END IF;
    
    -- For accounts_vault indexes
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACCOUNTS_USER';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_accounts_user ON accounts_vault(user_id)';
        DBMS_OUTPUT.PUT_LINE('Created idx_accounts_user');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_accounts_user already exists');
    END IF;
    
    -- Skip idx_accounts_number as account_number has UNIQUE constraint
    DBMS_OUTPUT.PUT_LINE('Skipping idx_accounts_number - covered by UNIQUE constraint');
    
    -- For users_vault indexes - skip as they have UNIQUE constraints
    DBMS_OUTPUT.PUT_LINE('Skipping idx_users_username - covered by UNIQUE constraint');
    DBMS_OUTPUT.PUT_LINE('Skipping idx_users_email - covered by UNIQUE constraint');
    
    -- For refresh_tokens_vault indexes
    -- Skip idx_refresh_token_token as token has UNIQUE constraint
    DBMS_OUTPUT.PUT_LINE('Skipping idx_refresh_token_token - covered by UNIQUE constraint');
    
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_REFRESH_TOKEN_EXPIRY';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_refresh_token_expiry ON refresh_tokens_vault(expires_at)';
        DBMS_OUTPUT.PUT_LINE('Created idx_refresh_token_expiry');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_refresh_token_expiry already exists');
    END IF;
    
    -- For audit_log_vault indexes
    SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_AUDIT_TABLE_RECORD';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_audit_table_record ON audit_log_vault(table_name, record_id)';
        DBMS_OUTPUT.PUT_LINE('Created idx_audit_table_record');
    ELSE
        DBMS_OUTPUT.PUT_LINE('idx_audit_table_record already exists');
    END IF;
    
    COMMIT;
END;
/

-- =====================================================
-- CREATE VIEW FOR ACCOUNT BALANCES
-- =====================================================

CREATE OR REPLACE VIEW v_account_balances AS
SELECT
    a.account_id,
    a.account_number,
    a.account_name,
    a.account_category,
    a.currency,
    a.user_id,
    u.username,
    u.full_name,
    a.balance AS current_balance,
    a.status,
    NVL((SELECT SUM(amount) FROM ledger_vault 
        WHERE account_id = a.account_id AND entry_type = 'DEBIT' AND status = 'COMPLETED'), 0) AS total_debits,
    NVL((SELECT SUM(amount) FROM ledger_vault 
        WHERE account_id = a.account_id AND entry_type = 'CREDIT' AND status = 'COMPLETED'), 0) AS total_credits,
    CASE
    WHEN a.balance = (
            NVL((SELECT SUM(amount) FROM ledger_vault 
                WHERE account_id = a.account_id AND entry_type = 'DEBIT' AND status = 'COMPLETED'), 0) -
            NVL((SELECT SUM(amount) FROM ledger_vault 
                WHERE account_id = a.account_id AND entry_type = 'CREDIT' AND status = 'COMPLETED'), 0)
        ) THEN 'VERIFIED'
        ELSE 'INCONSISTENT'
    END AS balance_status,
    a.created_at,
    a.updated_at
FROM accounts_vault a
JOIN users_vault u ON a.user_id = u.user_id;

-- =====================================================
-- CREATE VIEW FOR TRANSACTION HISTORY
-- =====================================================

CREATE OR REPLACE VIEW v_transaction_history AS
SELECT
    l.ledger_id,
    l.transaction_ref,
    l.transaction_uuid,
    l.account_id,
    a_from.account_number AS account_number,
    a_from.account_name AS account_name,
    l.contra_account_id,
    a_to.account_number AS contra_account_number,
    a_to.account_name AS contra_account_name,
    l.amount,
    l.entry_type,
    l.transaction_type,
    l.description,
    l.status,
    l.created_at,
    u.username,
    u.full_name
FROM ledger_vault l
JOIN accounts_vault a_from ON l.account_id = a_from.account_id
LEFT JOIN accounts_vault a_to ON l.contra_account_id = a_to.account_id
JOIN users_vault u ON a_from.user_id = u.user_id;

-- =====================================================
-- INSERT SAMPLE DATA (for testing)
-- =====================================================

-- Insert users (password: 'Test@123' - BCrypt hash)
INSERT INTO users_vault (user_id, username, password_hash, email, full_name, phone_number, two_factor_enabled) 
VALUES (seq_users_vault.NEXTVAL, 'john_doe', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr5J7jsKQ3DL5KpYkYzqL8X9zQqJqKq', 'john.doe@email.com', 'John Doe', '+1234567890', 1);

INSERT INTO users_vault (user_id, username, password_hash, email, full_name, phone_number, two_factor_enabled) 
VALUES (seq_users_vault.NEXTVAL, 'jane_smith', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr5J7jsKQ3DL5KpYkYzqL8X9zQqJqKq', 'jane.smith@email.com', 'Jane Smith', '+1234567891', 0);

INSERT INTO users_vault (user_id, username, password_hash, email, full_name, phone_number, two_factor_enabled) 
VALUES (seq_users_vault.NEXTVAL, 'admin_user', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr5J7jsKQ3DL5KpYkYzqL8X9zQqJqKq', 'admin@vaultcore.com', 'Admin User', '+1234567899', 1);

-- Insert accounts for john_doe (user_id = 1)
-- For John's accounts (user_id = 1)
INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-CHK-100001', 'John Checking', 'CHECKING', 'ASSET', 15000.00, 1, 10000);

INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-SAV-100001', 'John Savings', 'SAVINGS', 'ASSET', 50000.00, 1, 5000);

-- For Jane's accounts (user_id = 2)
INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-CHK-200001', 'Jane Checking', 'CHECKING', 'ASSET', 25000.00, 2, 10000);

INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-INV-200001', 'Jane Investment', 'INVESTMENT', 'ASSET', 100000.00, 2, 50000);

INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-LOAN-200001', 'Jane Loan', 'LOAN', 'LIABILITY', 25000.00, 2, 0);

-- For Admin's accounts (user_id = 3)
INSERT INTO accounts_vault (account_id, account_number, account_name, account_type, account_category, balance, user_id, daily_transaction_limit)
VALUES (seq_accounts_vault.NEXTVAL, 'ACC-CHK-300001', 'Admin Checking', 'CHECKING', 'ASSET', 50000.00, 3, 50000);


-- Insert sample ledger entries (transactions)
DECLARE
    v_txn_ref VARCHAR2(50);
    v_txn_uuid RAW(16);
    v_from_acc NUMBER;
    v_to_acc NUMBER;
BEGIN
    -- Transaction 1: John transfers $1000 from checking to savings
    v_txn_uuid := SYS_GUID();
    v_txn_ref := 'TXN-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDD') || '-' || seq_transaction_vault.NEXTVAL;
    
    SELECT account_id INTO v_from_acc FROM accounts_vault WHERE account_number = 'ACC-CHK-100001';
    SELECT account_id INTO v_to_acc FROM accounts_vault WHERE account_number = 'ACC-SAV-100001';
    
    -- Debit from checking (asset decreases with credit)
    INSERT INTO ledger_vault (ledger_id, transaction_uuid, transaction_ref, account_id, contra_account_id, 
                            amount, entry_type, transaction_type, description, status)
    VALUES (seq_ledger_vault.NEXTVAL, v_txn_uuid, v_txn_ref, v_from_acc, v_to_acc, 
            1000.00, 'CREDIT', 'TRANSFER', 'Transfer to savings', 'COMPLETED');

    -- Credit to savings (asset increases with debit)
    INSERT INTO ledger_vault (ledger_id, transaction_uuid, transaction_ref, account_id, contra_account_id, 
                            amount, entry_type, transaction_type, description, status)
    VALUES (seq_ledger_vault.NEXTVAL, v_txn_uuid, v_txn_ref || '-C', v_to_acc, v_from_acc, 
            1000.00, 'DEBIT', 'TRANSFER', 'Received from checking', 'COMPLETED');
    
    -- Transaction 2: Jane transfers $5000 from checking to investment
    v_txn_uuid := SYS_GUID();
    v_txn_ref := 'TXN-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDD') || '-' || seq_transaction_vault.NEXTVAL;
    
    SELECT account_id INTO v_from_acc FROM accounts_vault WHERE account_number = 'ACC-CHK-200001';
    SELECT account_id INTO v_to_acc FROM accounts_vault WHERE account_number = 'ACC-INV-200001';
    
    -- Debit from checking
    INSERT INTO ledger_vault (ledger_id, transaction_uuid, transaction_ref, account_id, contra_account_id, 
                            amount, entry_type, transaction_type, description, status)
    VALUES (seq_ledger_vault.NEXTVAL, v_txn_uuid, v_txn_ref, v_from_acc, v_to_acc, 
            5000.00, 'CREDIT', 'TRANSFER', 'Transfer to investment', 'COMPLETED');

    -- Credit to investment
    INSERT INTO ledger_vault (ledger_id, transaction_uuid, transaction_ref, account_id, contra_account_id, 
                            amount, entry_type, transaction_type, description, status)
    VALUES (seq_ledger_vault.NEXTVAL, v_txn_uuid, v_txn_ref || '-C', v_to_acc, v_from_acc, 
            5000.00, 'DEBIT', 'TRANSFER', 'Received from checking', 'COMPLETED');
    
    COMMIT;
END;
/


-- =====================================================
-- WEEK 2: ESSENTIAL ADD-ONS for Transaction Engine
-- =====================================================

-- 1. FRAUD ALERTS TABLE
CREATE SEQUENCE seq_fraud_alerts START WITH 1;

CREATE TABLE fraud_alerts (
    alert_id NUMBER PRIMARY KEY,
    transaction_ref VARCHAR2(50),
    account_id NUMBER,
    amount NUMBER(19,4),
    alert_type VARCHAR2(20),
    severity VARCHAR2(10),
    two_factor_triggered NUMBER(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fraud_account FOREIGN KEY (account_id) REFERENCES accounts_vault(account_id)
);

-- 2. FRAUD DETECTION TRIGGER
CREATE OR REPLACE TRIGGER trg_fraud_detection
AFTER INSERT ON ledger_vault
FOR EACH ROW
BEGIN
    IF :NEW.amount > 5000 THEN
        INSERT INTO fraud_alerts (alert_id, transaction_ref, account_id, amount, alert_type, severity, two_factor_triggered)
        VALUES (seq_fraud_alerts.NEXTVAL, :NEW.transaction_ref, :NEW.account_id, :NEW.amount, 'HIGH_VALUE', 'HIGH', 1);
    END IF;
END;
/

-- 3. TRANSFER PROCEDURE WITH SERIALIZABLE
CREATE OR REPLACE PROCEDURE sp_transfer(
    p_from IN NUMBER,
    p_to IN NUMBER,
    p_amt IN NUMBER,
    p_ref OUT VARCHAR2,
    p_success OUT NUMBER,
    p_msg OUT VARCHAR2
) AS
    v_bal NUMBER;
BEGIN
    EXECUTE IMMEDIATE 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE';
    
    SELECT balance INTO v_bal FROM accounts_vault
    WHERE account_id = p_from FOR UPDATE;
    
    IF v_bal < p_amt THEN
        p_success := 0;
        p_msg := 'Insufficient funds';
        ROLLBACK;
        RETURN;
    END IF;
SELECT 'TXN-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || seq_transaction_vault.NEXTVAL
    INTO p_ref FROM DUAL;
    
    INSERT INTO ledger_vault (ledger_id, transaction_ref, account_id, contra_account_id, amount, entry_type, transaction_type)
    VALUES (seq_ledger_vault.NEXTVAL, p_ref, p_from, p_to, p_amt, 'CREDIT', 'TRANSFER');
    
    INSERT INTO ledger_vault (ledger_id, transaction_ref, account_id, contra_account_id, amount, entry_type, transaction_type)
    VALUES (seq_ledger_vault.NEXTVAL, p_ref||'-C', p_to, p_from, p_amt, 'DEBIT', 'TRANSFER');
    
    COMMIT;
    p_success := 1;
    p_msg := 'Success';
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := 0;
        p_msg := SQLERRM;
END;
/

-- 4. GET BALANCE FUNCTION
CREATE OR REPLACE FUNCTION fn_balance(p_id NUMBER) RETURN SYS_REFCURSOR IS
    c SYS_REFCURSOR;
BEGIN
    OPEN c FOR
        SELECT account_id, account_number, balance, status, version
        FROM accounts_vault
        WHERE account_id = p_id;
    RETURN c;
END;
/

-- 5. CONCURRENCY TEST PROCEDURE
CREATE OR REPLACE PROCEDURE sp_concurrency_test(p_id NUMBER) AS
BEGIN
    FOR i IN 1..100 LOOP
        UPDATE accounts_vault
        SET balance = balance - 10, version = version + 1
        WHERE account_id = p_id AND balance >= 10;
        COMMIT;
    END LOOP;
END;
/

CREATE OR REPLACE VIEW v_daily_summary AS
SELECT
    TRUNC(created_at) AS transaction_date,
    account_id,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_amount,
    COUNT(DISTINCT transaction_uuid) AS unique_transactions
FROM ledger_vault
GROUP BY TRUNC(created_at), account_id;
/

-- 7. TEST THE TRANSFER PROCEDURE
DECLARE
    v_ref VARCHAR2(50);
    v_suc NUMBER;
    v_msg VARCHAR2(200);
BEGIN
    sp_transfer(1, 2, 100, v_ref, v_suc, v_msg);
    DBMS_OUTPUT.PUT_LINE('Ref: ' || v_ref || ' Status: ' || v_msg);
END;
/