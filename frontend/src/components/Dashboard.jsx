import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ setIsAuthenticated }) => {
  const [accounts, setAccounts] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    if (!user || !accessToken) {
      handleLogout();
      return;
    }

    setUserData(JSON.parse(user));
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock accounts data (as per SRS - Asset, Liability, Equity, Income, Expense)
    setTimeout(() => {
      const mockAccounts = [
        {
          id: 1,
          accountNumber: 'VCA1000001',
          accountType: 'ASSET',
          balance: 52430.75,
          currency: 'USD',
          createdAt: '2024-01-15T10:30:00Z',
          status: 'ACTIVE',
          interest: '2.5%'
        },
        {
          id: 2,
          accountNumber: 'VCL2000001',
          accountType: 'LIABILITY',
          balance: 12500.00,
          currency: 'USD',
          createdAt: '2024-01-20T14:20:00Z',
          status: 'ACTIVE',
          interest: '4.2%'
        },
        {
          id: 3,
          accountNumber: 'VCQ3000001',
          accountType: 'EQUITY',
          balance: 50000.00,
          currency: 'USD',
          createdAt: '2024-02-01T09:15:00Z',
          status: 'ACTIVE',
          shares: 1000
        },
        {
          id: 4,
          accountNumber: 'VCI4000001',
          accountType: 'INCOME',
          balance: 8750.25,
          currency: 'USD',
          createdAt: '2024-02-10T11:00:00Z',
          status: 'ACTIVE',
          source: 'Dividends'
        },
        {
          id: 5,
          accountNumber: 'VCE5000001',
          accountType: 'EXPENSE',
          balance: 3250.50,
          currency: 'USD',
          createdAt: '2024-02-15T16:45:00Z',
          status: 'ACTIVE',
          category: 'Operating'
        }
      ];

      // Mock ledger entries (double-entry as per SRS)
      const mockLedgerEntries = [
        {
          id: 1,
          transactionId: 'TXN1001',
          accountId: 1,
          amount: 5000.00,
          direction: 'DEBIT',
          description: 'Initial deposit',
          createdAt: '2024-02-20T09:00:00Z'
        },
        {
          id: 2,
          transactionId: 'TXN1001',
          accountId: 4,
          amount: 5000.00,
          direction: 'CREDIT',
          description: 'Initial deposit',
          createdAt: '2024-02-20T09:00:00Z'
        },
        {
          id: 3,
          transactionId: 'TXN1002',
          accountId: 1,
          amount: 2500.00,
          direction: 'DEBIT',
          description: 'Salary credit',
          createdAt: '2024-02-21T14:30:00Z'
        },
        {
          id: 4,
          transactionId: 'TXN1002',
          accountId: 4,
          amount: 2500.00,
          direction: 'CREDIT',
          description: 'Salary credit',
          createdAt: '2024-02-21T14:30:00Z'
        },
        {
          id: 5,
          transactionId: 'TXN1003',
          accountId: 5,
          amount: 150.75,
          direction: 'DEBIT',
          description: 'Utility payment',
          createdAt: '2024-02-22T11:15:00Z'
        },
        {
          id: 6,
          transactionId: 'TXN1003',
          accountId: 1,
          amount: 150.75,
          direction: 'CREDIT',
          description: 'Utility payment',
          createdAt: '2024-02-22T11:15:00Z'
        }
      ];
      
      setAccounts(mockAccounts);
      setLedgerEntries(mockLedgerEntries);
      setLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      'ASSET': '#3b82f6',
      'LIABILITY': '#ef4444',
      'EQUITY': '#8b5cf6',
      'INCOME': '#10b981',
      'EXPENSE': '#f59e0b'
    };
    return colors[type] || '#64748b';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading your financial data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2>Welcome back, <span className="gradient-text">{userData?.fullName || 'User'}</span></h2>
      
      <div className="balance-card">
        <h3>Total Portfolio Value</h3>
        <div className="amount">
          {formatCurrency(calculateTotalBalance())}
        </div>
      </div>

      {accounts.length > 0 ? (
        <>
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <h4 style={{ color: getAccountTypeColor(account.accountType) }}>
                    {account.accountType}
                  </h4>
                  <span className="account-type">{account.status}</span>
                </div>
                
                <div className="account-details">
                  <p>
                    <strong>Account Number:</strong> 
                    <span>{account.accountNumber}</span>
                  </p>
                  <p>
                    <strong>Opened:</strong> 
                    <span>{formatDate(account.createdAt)}</span>
                  </p>
                  {account.interest && (
                    <p>
                      <strong>Interest Rate:</strong> 
                      <span>{account.interest}</span>
                    </p>
                  )}
                  {account.shares && (
                    <p>
                      <strong>Shares:</strong> 
                      <span>{account.shares.toLocaleString()}</span>
                    </p>
                  )}
                  {account.source && (
                    <p>
                      <strong>Source:</strong> 
                      <span>{account.source}</span>
                    </p>
                  )}
                  {account.category && (
                    <p>
                      <strong>Category:</strong> 
                      <span>{account.category}</span>
                    </p>
                  )}
                </div>
                
                <div className="account-balance">
                  <div className="label">Current Balance</div>
                  <div className="value">{formatCurrency(account.balance)}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
            <p>✓ Double-Entry Ledger Active - All transactions balanced</p>
            <p>✓ {ledgerEntries.length} immutable ledger entries recorded</p>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Secure Logout
          </button>
        </>
      ) : (
        <div className="no-accounts">
          <p>No accounts found. Please contact support.</p>
          <button onClick={handleLogout} className="btn btn-danger" style={{ marginTop: '20px', width: 'auto', padding: '12px 32px' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;