import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    
    useEffect(() => {
        fetchTransactions();
    }, []);
    
    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/history');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'fraud') return tx.fraudFlagged;
        if (filter === '2fa') return tx.twoFactorRequired;
        return true;
    });
    
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
                <div className="card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="card-title mb-0">
                            <i className="fas fa-history me-2"></i>
                            Transaction History
                        </h4>
                        
                        <div>
                            <select 
                                className="form-control"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Transactions</option>
                                <option value="fraud">Fraud Flagged</option>
                                <option value="2fa">2FA Required</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Flags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.transactionRef}>
                                        <td>
                                            <small>{tx.transactionRef}</small>
                                        </td>
                                        <td>{tx.fromAccountName}</td>
                                        <td>{tx.toAccountName || 'N/A'}</td>
                                        <td>
                                            <strong>${tx.amount.toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                tx.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>
                                            {tx.fraudFlagged && (
                                                <span className="badge badge-danger me-1">
                                                    <i className="fas fa-exclamation-triangle"></i> Fraud
                                                </span>
                                            )}
                                            {tx.twoFactorRequired && (
                                                <span className="badge badge-warning">
                                                    <i className="fas fa-shield-alt"></i> 2FA
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredTransactions.length === 0 && (
                        <p className="text-center text-muted py-4">
                            No transactions found
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Transactions;