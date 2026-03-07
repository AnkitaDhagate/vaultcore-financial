# 💎 VaultCore Financial Platform

**A production-grade full-stack banking application** built with Spring Boot 3, React 19, and MySQL 8 — featuring JWT authentication, double-entry ledger accounting, real-time stock tracking, fraud detection with 2FA, and AOP-powered audit logging.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Prerequisites](#5-prerequisites)
6. [Database Setup](#6-database-setup)
7. [Backend Installation & Configuration](#7-backend-installation--configuration)
8. [Frontend Installation & Configuration](#8-frontend-installation--configuration)
9. [Running the Application](#9-running-the-application)
10. [API Reference](#10-api-reference)
11. [Feature Walkthrough (Live Demo Guide)](#11-feature-walkthrough-live-demo-guide)
12. [Security Architecture](#12-security-architecture)
13. [Fraud Detection & 2FA](#13-fraud-detection--2fa)
14. [Double-Entry Ledger System](#14-double-entry-ledger-system)
15. [Concurrency & Transaction Isolation](#15-concurrency--transaction-isolation)
16. [Environment Configuration Reference](#16-environment-configuration-reference)
17. [Sample Data & Test Credentials](#17-sample-data--test-credentials)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project Overview

VaultCore is a secure, feature-complete digital banking platform that demonstrates enterprise-level backend engineering patterns alongside a polished React frontend. It is designed to serve as both a working prototype and a reference implementation for real-world financial systems.

### Key Capabilities

| Feature | Details |
|---|---|
| **Authentication** | JWT access tokens + refresh tokens, BCrypt password hashing |
| **Account Management** | Auto-provisioned Savings & Checking accounts on registration |
| **Fund Transfers** | Between any two accounts with full double-entry ledger recording |
| **Fraud Detection** | Configurable threshold triggers a 6-digit OTP challenge (2FA) |
| **Transaction History** | Full immutable ledger with search, filter by DEBIT/CREDIT, and sort |
| **Stock Portfolio** | Live simulated price feed with real-time Recharts line chart |
| **Audit Logging** | AspectJ AOP intercepts every service call and logs to DB asynchronously |
| **Currency** | All monetary values displayed in Indian Rupees (₹, INR) |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)            │
│  Login  │  Dashboard  │  Transfer  │  History  │  Portfolio │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP/REST (Axios, JWT Bearer Token)
                       │  Proxy → localhost:8081/api
┌──────────────────────▼──────────────────────────────────┐
│              Spring Boot Backend (Port 8081)             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │AuthController│  │TransferCtrl  │  │ StockController │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼──────────────────▼───────────────────▼──────┐  │
│  │          Service Layer                              │  │
│  │  TransferService (SERIALIZABLE isolation + locks)   │  │
│  │  FraudDetectionService (OTP / 2FA)                 │  │
│  │  StockService (simulated live prices)               │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │  AuditAspect (AspectJ AOP — @Around all services)   │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │  JPA Repositories → HikariCP → MySQL 8              │  │
│  │  Tables: users, accounts, ledger, two_factor_        │  │
│  │          challenges, audit_log                      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Request Flow (Fund Transfer)

```
Frontend POST /api/transfers
  → JwtAuthenticationFilter (validates Bearer token)
    → TransferController.transferMoney()
      → FraudDetectionService.checkAndChallenge()
          IF amount > threshold → create OTP challenge → return 202
          IF challengeId present → verifyChallenge()
      → TransferService.transferMoney() [SERIALIZABLE + PESSIMISTIC_WRITE]
          → Deduct fromAccount balance
          → Add toAccount balance
          → Write DEBIT ledger row
          → Write CREDIT ledger row
      → AuditAspect logs method + result asynchronously
    ← 200 { transactionId }
```

---

## 3. Tech Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Framework | Spring Boot | 3.1.5 |
| Language | Java | 21 LTS |
| Security | Spring Security + JJWT | 0.11.5 |
| ORM | Spring Data JPA / Hibernate | included in Boot 3.1.5 |
| Database | MySQL | 8.0.45 |
| Connection Pool | HikariCP | included in Boot 3.1.5 |
| AOP | Spring AOP / AspectJ | included in Boot 3.1.5 |
| Build Tool | Maven | 3.x |
| Threading | Java 21 Virtual Threads | JEP 444 |
| Utilities | Lombok | latest |

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | React | 19.x |
| Routing | React Router DOM | 7.x |
| HTTP Client | Axios | 1.x |
| UI Framework | Bootstrap | 5.3 |
| Charts | Recharts | 3.x |
| Build Tool | Create React App | 5.0.1 |

### Database Schema

| Table | Purpose |
|---|---|
| `users` | Stores registered user credentials and roles |
| `accounts` | Savings & Checking accounts with real-time balance |
| `ledger` | Immutable double-entry records for every transaction |
| `two_factor_challenges` | OTP challenges for high-value transfer 2FA |
| `audit_log` | AOP-generated audit trail of all service invocations |

---

## 4. Project Structure

```
vaultcore/
├── vaultcore-backend/                  # Spring Boot application
│   ├── src/main/java/com/vaultcore/
│   │   ├── VaultcoreApplication.java   # Entry point
│   │   ├── aspect/
│   │   │   └── AuditAspect.java        # AspectJ @Around audit logging
│   │   ├── config/
│   │   │   └── CorsConfig.java         # CORS configuration
│   │   ├── controller/
│   │   │   ├── AuthController.java     # /api/auth/login, /api/auth/register
│   │   │   ├── AccountController.java  # /api/accounts/**
│   │   │   ├── TransferController.java # /api/transfers
│   │   │   └── StockController.java    # /api/stocks
│   │   ├── dto/
│   │   │   ├── JwtResponse.java        # Login response payload
│   │   │   ├── LoginRequest.java       # Login request payload
│   │   │   └── TransferRequest.java    # Transfer request payload
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   ├── Account.java
│   │   │   ├── Ledger.java             # Immutable ledger entry
│   │   │   ├── TwoFactorChallenge.java # 2FA OTP record
│   │   │   └── AuditLog.java
│   │   ├── repository/                 # Spring Data JPA interfaces
│   │   ├── security/
│   │   │   ├── JwtUtil.java            # Token generation & validation
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   ├── SecurityConfig.java     # HTTP security rules
│   │   │   └── CustomUserDetails.java
│   │   └── service/
│   │       ├── TransferService.java    # Core transfer logic + ledger
│   │       ├── FraudDetectionService.java
│   │       ├── StockService.java       # Simulated price feed
│   │       └── CustomUserDetailsService.java
│   ├── src/main/resources/
│   │   └── application.properties      # All configuration
│   └── pom.xml
│
├── vaultcore-frontend/                 # React application
│   ├── src/
│   │   ├── App.js                      # Router + auth guard
│   │   ├── config/
│   │   │   └── api.js                  # Base URL constants
│   │   └── components/
│   │       ├── Login.js                # Sign in / Register UI
│   │       ├── Navbar.js               # Navigation bar
│   │       ├── Dashboard.js            # Account overview
│   │       ├── Transfer.js             # Fund transfer + 2FA flow
│   │       ├── TransactionHistory.js   # Ledger viewer with filters
│   │       └── Portfolio.js            # Live stock chart
│   ├── package.json
│   └── public/
│
└── schema.sql                          # Database schema + seed data
```

---

## 5. Prerequisites

Ensure all of the following are installed before proceeding:

| Tool | Required Version | Check Command |
|---|---|---|
| Java JDK | 21 (LTS) | `java -version` |
| Maven | 3.6+ | `mvn -version` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL Server | 8.0+ | `mysql --version` |
| Git | Any | `git --version` |

> **Java 21 is mandatory.** The backend uses Virtual Threads (`spring.threads.virtual.enabled=true`), which is a Java 21 feature (JEP 444). The application will not compile on Java 17 or below.

---

## 6. Database Setup

### Step 1 — Start MySQL and connect as root

```bash
mysql -u root -p
```

### Step 2 — Create the database and dedicated user

```sql
CREATE DATABASE vaultcore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'vaultcore_user'@'localhost' IDENTIFIED BY 'VaultCore@2026';

GRANT ALL PRIVILEGES ON vaultcore_db.* TO 'vaultcore_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

### Step 3 — Run the schema and seed data

```bash
mysql -u vaultcore_user -p vaultcore_db < schema.sql
```

This creates five tables (`users`, `accounts`, `ledger`, `two_factor_challenges`, `audit_log`) and inserts three sample users with seeded accounts.

### Step 4 — Verify

```sql
mysql -u vaultcore_user -p vaultcore_db

SELECT username, email, role FROM users;
SELECT account_number, account_type, balance FROM accounts;
EXIT;
```

Expected output:

```
+------------+----------------------+-------+
| username   | email                | role  |
+------------+----------------------+-------+
| john_doe   | john@example.com     | USER  |
| jane_smith | jane@example.com     | USER  |
| admin      | admin@vaultcore.com  | ADMIN |
+------------+----------------------+-------+

+----------------+--------------+-----------+
| account_number | account_type | balance   |
+----------------+--------------+-----------+
| ACC001         | SAVINGS      | 5000.0000 |
| ACC002         | CHECKING     | 2500.0000 |
| ACC003         | SAVINGS      | 10000.0000|
| ACC004         | CHECKING     | 3000.0000 |
+----------------+--------------+-----------+
```

---

## 7. Backend Installation & Configuration

### Step 1 — Clone / Extract the backend

```bash
# If using the zip
unzip vaultcore_backend.zip
cd vaultcore_backend
```

### Step 2 — Verify `application.properties`

The file lives at `src/main/resources/application.properties`. The default values work out of the box if you followed the database setup above exactly.

```properties
# Server
server.port=8081

# Database — update password if you used a different one
spring.datasource.url=jdbc:mysql://localhost:3306/vaultcore_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=vaultcore_user
spring.datasource.password=VaultCore@2026

# JWT — change this secret in production
jwt.secret=mySecretKeyForJWTGeneration2024VaultCoreFinancialWithExtraSecurityMeasures
jwt.expiration=86400000       # 24 hours in milliseconds
jwt.refresh.expiration=604800000  # 7 days in milliseconds

# Fraud Detection
fraud.threshold=10000         # Transfers above ₹10,000 require OTP
fraud.otp.expiry.minutes=5
fraud.sms-mock-enabled=true   # OTP printed to console (no real SMS needed)

# Virtual Threads (Java 21)
spring.threads.virtual.enabled=true
```

### Step 3 — Build the project

```bash
mvn clean install -DskipTests
```

> The first build downloads dependencies from Maven Central. This takes 2–5 minutes. Subsequent builds are fast.

### Step 4 — Run the backend

```bash
mvn spring-boot:run
```

You should see:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v3.1.5)

INFO  VaultcoreApplication - Started VaultcoreApplication in 3.4 seconds
INFO  o.s.b.w.embedded.tomcat.TomcatWebServer - Tomcat started on port(s): 8081
```

### Step 5 — Smoke test

```bash
curl http://localhost:8081/api/auth/test
# Expected: "Auth controller is reachable!"
```

---

## 8. Frontend Installation & Configuration

### Step 1 — Navigate to the frontend directory

```bash
cd vaultcore-frontend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Verify API configuration

Open `src/config/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8081/api';

export const AUTH_URL      = `${API_BASE_URL}/auth`;
export const ACCOUNTS_URL  = `${API_BASE_URL}/accounts`;
export const TRANSFERS_URL = `${API_BASE_URL}/transfers`;
export const STOCKS_URL    = `${API_BASE_URL}/stocks`;
```

The `package.json` also contains `"proxy": "http://localhost:8081/api"` which handles CORS automatically during development.

> If your backend runs on a different port, update `API_BASE_URL` in `api.js` and the `proxy` field in `package.json`.

---

## 9. Running the Application

### Start order matters — always start the backend first.

**Terminal 1 — Backend:**
```bash
cd vaultcore_backend
mvn spring-boot:run
# Wait for: "Started VaultcoreApplication"
```

**Terminal 2 — Frontend:**
```bash
cd vaultcore-frontend
npm start
# Browser opens automatically at http://localhost:3000
```

### Access Points

| Service | URL |
|---|---|
| Frontend App | http://localhost:3000 |
| Backend API | http://localhost:8081/api |
| Auth Endpoint | http://localhost:8081/api/auth/login |
| Accounts Endpoint | http://localhost:8081/api/accounts |
| Transfers Endpoint | http://localhost:8081/api/transfers |
| Stocks Endpoint | http://localhost:8081/api/stocks |

---

## 10. API Reference

All endpoints (except `/api/auth/**`) require the header:
```
Authorization: Bearer <jwt_token>
```

### Authentication

#### `POST /api/auth/register`

Register a new user. Savings (₹1,000) and Checking (₹500) accounts are auto-created.

**Request Body:**
```json
{
  "username": "alice",
  "password": "secret123",
  "email": "alice@example.com",
  "phone": "+91 9876543210"
}
```

**Response `201`:**
```json
{
  "message": "User registered successfully!"
}
```

---

#### `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "username": "john_doe",
  "role": "USER"
}
```

---

### Accounts

#### `GET /api/accounts/user/{userId}`
Returns all accounts belonging to the given user.

**Response `200`:**
```json
[
  {
    "id": 1,
    "accountNumber": "ACC001",
    "accountType": "SAVINGS",
    "balance": 5000.00
  },
  {
    "id": 2,
    "accountNumber": "ACC002",
    "accountType": "CHECKING",
    "balance": 2500.00
  }
]
```

---

#### `GET /api/accounts/{accountNumber}/history`
Returns the full ledger history for an account.

**Response `200`:**
```json
[
  {
    "transactionId": "TXN-550e8400-e29b-41d4",
    "entryType": "DEBIT",
    "amount": 500.00,
    "balanceAfter": 4500.00,
    "counterpartAccount": "ACC003",
    "description": "Rent payment",
    "createdAt": "2026-03-07 14:32:10"
  }
]
```

---

#### `POST /api/accounts/provision/{userId}`
Creates default Savings and Checking accounts for an existing user who was registered without accounts.

---

### Transfers

#### `POST /api/transfers`

**Normal transfer (amount ≤ ₹10,000):**

**Request Body:**
```json
{
  "fromAccount": "ACC001",
  "toAccount": "ACC003",
  "amount": 500.00,
  "description": "Monthly rent"
}
```

**Response `200`:**
```json
{
  "message": "Transfer successful!",
  "transactionId": "TXN-550e8400-e29b-41d4-a716",
  "requires2FA": false
}
```

---

**High-value transfer — Step 1 (amount > ₹10,000):**

**Response `202`:**
```json
{
  "requires2FA": true,
  "challengeId": "2FA-abc123",
  "message": "OTP sent to your registered phone/email",
  "hint": "Check your backend console for the mock OTP"
}
```

**High-value transfer — Step 2 (submit OTP):**

```json
{
  "fromAccount": "ACC001",
  "toAccount": "ACC003",
  "amount": 15000.00,
  "description": "Car loan payment",
  "challengeId": "2FA-abc123",
  "otpCode": "847291"
}
```

---

### Stocks

#### `GET /api/stocks`
Returns all available stocks with current simulated prices.

```json
{
  "AAPL": 18245.50,
  "GOOGL": 14332.75,
  "MSFT": 38921.00,
  "TSLA": 21045.20
}
```

#### `GET /api/stocks/{symbol}`
Returns the live-simulated price for a single stock symbol. Called every 5 seconds by the Portfolio component.

```json
{
  "symbol": "AAPL",
  "price": 18267.30
}
```

---

## 11. Feature Walkthrough (Live Demo Guide)

### Step 1 — Register a New User

1. Open http://localhost:3000
2. Click **"Create Account"** tab
3. Enter username, email, and password (min. 6 chars)
4. Click **"Create Account"**
5. A success message appears. Savings (₹1,000) and Checking (₹500) accounts are created instantly.

---

### Step 2 — Login and View Dashboard

1. Switch to **"Sign In"** tab
2. Login with the credentials you just created (or use `john_doe` / `password`)
3. The Dashboard shows account cards with balances in ₹ (Indian Rupee format)
4. Click **"💸 Send Money"** or **"📈 View Portfolio"** for quick navigation

---

### Step 3 — Make a Normal Transfer (≤ ₹10,000)

1. Navigate to **Transfer** in the top navbar
2. Select "From" account (your account) and "To" account (another user's account)
3. Enter an amount below ₹10,000, e.g., `500`
4. Add a description like `"Coffee money"`
5. Click **"Send Money"**
6. A green success banner with a Transaction ID appears

---

### Step 4 — Trigger Fraud Detection (> ₹10,000)

1. On the Transfer page, enter an amount above `10000`, e.g., `15000`
2. Click **"Send Money"**
3. The UI transitions to an **OTP verification screen**
4. Check the **backend terminal** — you will see a log line like:
   ```
   [MOCK SMS] OTP for john_doe: 847291 (expires in 5 min)
   ```
5. Enter the 6-digit OTP in the frontend
6. Click **"Verify & Complete Transfer"**
7. Transfer completes and the ledger is updated

---

### Step 5 — View Transaction History

1. Click **"📋 History"** in the navbar
2. Select an account from the dropdown
3. See the running balance, total received (green), total sent (red)
4. Use the **CREDIT / DEBIT / ALL** toggle buttons to filter
5. Type in the search box to find a specific transaction by description or ID
6. Toggle between **Newest First** and **Oldest First**

---

### Step 6 — Live Stock Portfolio

1. Click **"📈 Portfolio"** in the navbar
2. A list of stocks appears on the left with current ₹ prices
3. Select any stock — a live line chart updates every **5 seconds**
4. The chart header shows the latest price and the delta (▲ up / ▼ down) vs. the previous reading

---

## 12. Security Architecture

VaultCore implements a layered security model:

### JWT Token Flow

```
Login Request
  → AuthController validates credentials via AuthenticationManager
    → BCrypt password comparison
      → JwtUtil.generateToken() → signs with HMAC-SHA256
        → JwtResponse { token, refreshToken, userId, username, role }

Every subsequent request:
  → JwtAuthenticationFilter.doFilterInternal()
    → Extracts "Bearer <token>" from Authorization header
      → JwtUtil.validateToken()
        → Sets SecurityContextHolder authentication
          → Controller proceeds (or 401 if invalid/expired)
```

### Token Details

| Property | Value |
|---|---|
| Algorithm | HMAC-SHA256 (HS256) |
| Access token expiry | 24 hours |
| Refresh token expiry | 7 days |
| Storage (frontend) | `localStorage` |
| Claims | username, issuer, audience, issuedAt, expiration |

### Password Storage

All passwords are stored as BCrypt hashes with strength factor 10. Plain-text passwords are never stored or logged anywhere in the application.

### Route Protection

Every React route checks `localStorage.getItem('token')` before rendering. Unauthenticated users are redirected to `/login` via React Router `<Navigate>`.

---

## 13. Fraud Detection & 2FA

### How It Works

The `FraudDetectionService` runs before every transfer in `TransferController`:

```
Transfer amount received
  ↓
Amount ≤ fraud.threshold (₹10,000)?
  YES → proceed directly to TransferService
  NO  → generate 6-digit OTP via SecureRandom
         → save TwoFactorChallenge to DB (expires in 5 minutes)
         → mock-log OTP to console (ready for real SMS/email swap)
         → return 202 with challengeId to frontend

Frontend collects OTP from user
  ↓
Re-submit transfer with { challengeId, otpCode }
  ↓
FraudDetectionService.verifyChallenge()
  → challenge status == PENDING?  ✓
  → OTP matches?                  ✓
  → Not expired?                  ✓
     → mark challenge VERIFIED
     → proceed with transfer
```

### Configuration

```properties
fraud.threshold=10000          # Customize in application.properties
fraud.otp.expiry.minutes=5
fraud.sms-mock-enabled=true    # Set false + implement real provider for production
```

### Integrating a Real SMS/Email Provider

In `FraudDetectionService.java`, locate the `sendMockOtp()` method and replace the `log.info(...)` call with your provider SDK call (e.g., Twilio, AWS SNS, SendGrid).

---

## 14. Double-Entry Ledger System

Every successful transfer writes exactly **two immutable rows** to the `ledger` table:

| Row | entry_type | account_ref | counterpart_account | amount |
|---|---|---|---|---|
| 1 | `DEBIT` | `ACC001` (sender) | `ACC003` | 500.00 |
| 2 | `CREDIT` | `ACC003` (receiver) | `ACC001` | 500.00 |

### Immutability Enforcement

The schema enforces immutability at the database level via two MySQL triggers:

```sql
TRIGGER prevent_ledger_update  -- Blocks any UPDATE on ledger rows
TRIGGER prevent_ledger_delete  -- Blocks any DELETE on ledger rows
```

Any attempt to modify a past ledger record raises `SQLSTATE 45000` — "Ledger rows are immutable and cannot be modified."

The `Ledger` Java model also has no setter methods, preventing modification at the application layer.

### What `balance_after` Stores

Each ledger row records the account's running balance immediately after the entry. This makes it possible to reconstruct the full balance history of any account at any point in time, without relying on the current `accounts.balance` column.

---

## 15. Concurrency & Transaction Isolation

### SERIALIZABLE Isolation

`TransferService.transferMoney()` is annotated with:

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
```

This is the strictest ANSI isolation level. It prevents:
- Dirty reads
- Non-repeatable reads
- Phantom reads

### Pessimistic Locking

Both the sender and receiver accounts are locked before any balance check:

```java
accountRepository.findByAccountNumberWithLock(fromAccountNumber) // SELECT ... FOR UPDATE
accountRepository.findByAccountNumberWithLock(toAccountNumber)   // SELECT ... FOR UPDATE
```

Accounts are always locked in alphabetical order by account number to prevent deadlocks between concurrent threads.

### Virtual Threads (Java 21)

The `getBalance()` utility in `TransferService` uses a virtual thread executor:

```java
ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();
```

This allows thousands of concurrent balance read operations without exhausting the OS thread pool.

---

## 16. Environment Configuration Reference

All backend configuration lives in `src/main/resources/application.properties`.

### Database
| Property | Default | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/vaultcore_db` | JDBC connection string |
| `spring.datasource.username` | `vaultcore_user` | MySQL username |
| `spring.datasource.password` | `VaultCore@2026` | MySQL password |
| `spring.datasource.hikari.maximum-pool-size` | `20` | Max DB connections |

### JWT
| Property | Default | Description |
|---|---|---|
| `jwt.secret` | (long secret string) | HMAC-SHA256 signing key — **change in production** |
| `jwt.expiration` | `86400000` | Access token TTL in milliseconds (24h) |
| `jwt.refresh.expiration` | `604800000` | Refresh token TTL in milliseconds (7 days) |

### Fraud Detection
| Property | Default | Description |
|---|---|---|
| `fraud.threshold` | `10000` | Transfers above this amount (₹) trigger 2FA |
| `fraud.otp.expiry.minutes` | `5` | OTP validity window |
| `fraud.sms-mock-enabled` | `true` | Logs OTP to console instead of sending real SMS |

### CORS
| Property | Default | Description |
|---|---|---|
| `cors.allowed-origins` | `http://localhost:3000` | Add your production domain here |

---

## 17. Sample Data & Test Credentials

The `schema.sql` seeds the following accounts. Password for **all** sample users is `password`.

| Username | Password | Role | Accounts |
|---|---|---|---|
| `john_doe` | `password` | USER | ACC001 (Savings ₹5,000), ACC002 (Checking ₹2,500) |
| `jane_smith` | `password` | USER | ACC003 (Savings ₹10,000), ACC004 (Checking ₹3,000) |
| `admin` | `password` | ADMIN | None (provision via dashboard) |

### Quick Transfer Test

1. Login as `john_doe`
2. Transfer ₹500 from `ACC001` → `ACC003` (jane_smith's savings)
3. Login as `jane_smith` to confirm balance increased

### 2FA Test

1. Login as `john_doe`
2. Transfer ₹15,000 from `ACC001` → `ACC003`
3. Check backend console for the mock OTP
4. Enter OTP in the UI to complete the transfer

---

## 18. Troubleshooting

### Backend won't start — "Communications link failure"
MySQL is not running or the credentials are wrong. Verify:
```bash
mysql -u vaultcore_user -p vaultcore_db -e "SELECT 1;"
```
If this fails, revisit [Section 6 — Database Setup](#6-database-setup).

---

### Backend won't compile — "error: --release 21 not supported"
You are using Java 17 or below. Check your version:
```bash
java -version
```
Install Java 21 JDK from https://adoptium.net and ensure `JAVA_HOME` points to it.

---

### Frontend shows "Cannot connect to server" on Login
The backend is not running, or it started on a different port. Verify the backend is up:
```bash
curl http://localhost:8081/api/auth/test
```
Also confirm `"proxy": "http://localhost:8081/api"` is present in `package.json`.

---

### "No accounts found" on Dashboard after registration
This is handled automatically — the Dashboard shows a provisioning button. Click **"✅ Create My Accounts"** to instantly create Savings and Checking accounts. Alternatively, accounts are auto-provisioned on the next login if missing.

---

### OTP not appearing / 2FA stuck
Ensure `fraud.sms-mock-enabled=true` in `application.properties`. The OTP is printed to the **backend terminal** (not the browser). Search the console for a line like:
```
[MOCK SMS] OTP for john_doe: 847291 (expires in 5 min)
```

---

### Port 3000 or 8081 already in use
```bash
# Kill the process on port 3000
lsof -ti :3000 | xargs kill -9

# Kill the process on port 8081
lsof -ti :8081 | xargs kill -9
```

---

### `npm install` fails on Node version error
Upgrade Node.js to v18 or later:
```bash
node -v   # must be 18+
```
Use [nvm](https://github.com/nvm-sh/nvm) to manage multiple Node versions if needed.

---

*Built with Spring Boot 3 · React 19 · MySQL 8 · Java 21 Virtual Threads*
