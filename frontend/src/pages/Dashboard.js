import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import authService from '../services/auth';

function Dashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [accounts, setAccounts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [fraudAlerts, setFraudAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchDashboardData();
    }, []);
    
    const fetchDashboardData = async () => {
        try {
            const [accountsRes, transactionsRes, fraudRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/transactions/history'),
                api.get('/transactions/fraud-alerts')
            ]);
            
            setAccounts(accountsRes.data);
            setRecentTransactions(transactionsRes.data.slice(0, 5));
            setFraudAlerts(fraudRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const totalBalance = accounts
        .filter(acc => acc.accountCategory === 'ASSET')
        .reduce((sum, acc) => sum + acc.balance, 0);
    
    if (loading) {
        return (
            <div className="dashboard">
                <Navbar />
                <div className="container text-center mt-5">
                    <div className="loading"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="dashboard">
            <Navbar />
            
            <div className="container">
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="card">
                            <h5 className="card-title">
                                <i className="fas fa-wallet me-2"></i>
                                Total Balance
                            </h5>
                            <p className="balance-amount">
                                ${totalBalance.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <div className="col-md-4">
                        <div className="card">
                            <h5 className="card-title">
                                <i className="fas fa-credit-card me-2"></i>
                                Accounts
                            </h5>
                            <p className="display-4">{accounts.length}</p>
                        </div>
                    </div>
                    
                    <div className="col-md-4">
                        <div className="card">
                            <h5 className="card-title">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Fraud Alerts
                            </h5>
                            <p className={`display-4 ${fraudAlerts.length > 0 ? 'text-danger' : ''}`}>
                                {fraudAlerts.length}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="card">
                            <h5 className="card-title">Your Accounts</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Account</th>
                                            <th>Type</th>
                                            <th>Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map(account => (
                                            <tr key={account.accountId}>
                                                <td>{account.accountName}</td>
                                                <td>{account.accountType}</td>
                                                <td>${account.balance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button 
                                className="btn btn-primary mt-3"
                                onClick={() => navigate('/accounts')}
                            >
                                View All Accounts
                            </button>
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="card">
                            <h5 className="card-title">Recent Transactions</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map(tx => (
                                            <tr key={tx.transactionRef}>
                                                <td>{tx.transactionRef.substring(0, 8)}...</td>
                                                <td>${tx.amount.toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        tx.fraudFlagged ? 'badge-danger' : 'badge-success'
                                                    }`}>
                                                        {tx.fraudFlagged ? 'Flagged' : 'Completed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button 
                                className="btn btn-primary mt-3"
                                onClick={() => navigate('/transactions')}
                            >
                                View All Transactions
                            </button>
                        </div>
                    </div>
                </div>
                
                {fraudAlerts.length > 0 && (
                    <div className="card mt-4">
                        <h5 className="card-title text-danger">
                            <i className="fas fa-exclamation-circle me-2"></i>
                            Fraud Alerts
                        </h5>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Transaction</th>
                                        <th>Amount</th>
                                        <th>Type</th>
                                        <th>Severity</th>
                                        <th>2FA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fraudAlerts.map(alert => (
                                        <tr key={alert.alertId}>
                                            <td>{alert.transactionRef}</td>
                                            <td>${alert.amount.toLocaleString()}</td>
                                            <td>{alert.alertType}</td>
                                            <td>
                                                <span className={`badge ${
                                                    alert.severity === 'HIGH' ? 'badge-danger' : 'badge-warning'
                                                }`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td>
                                                {alert.twoFactorTriggered ? (
                                                    <i className="fas fa-check-circle text-success"></i>
                                                ) : (
                                                    <i className="fas fa-times-circle text-danger"></i>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;