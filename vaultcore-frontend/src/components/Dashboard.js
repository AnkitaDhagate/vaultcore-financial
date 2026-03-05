// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL } from '../config/api';

function Dashboard() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');   // ✅ FIX: Use logged-in user's ID

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            // ✅ FIX 1: Use dynamic userId from localStorage instead of hardcoded /user/1
            // ✅ FIX 2: Use ACCOUNTS_URL from config (port 8081, not 8080)
            const response = await axios.get(`${ACCOUNTS_URL}/user/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Failed to load accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your accounts...</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Welcome, {username}!</h2>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            <h4 className="mt-4">Your Accounts</h4>

            {accounts.length === 0 ? (
                <div className="alert alert-info">No accounts found for your profile.</div>
            ) : (
                <div className="row">
                    {accounts.map(account => (
                        <div key={account.id} className="col-md-6 mb-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">{account.accountType} Account</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">
                                        Account: {account.accountNumber}
                                    </h6>
                                    <p className="card-text display-6">
                                        ${account.balance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4">
                <h4>Quick Actions</h4>
                <div className="d-flex gap-2">
                    <a href="/transfer" className="btn btn-primary">Send Money</a>
                    <a href="/portfolio" className="btn btn-success">View Portfolio</a>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
