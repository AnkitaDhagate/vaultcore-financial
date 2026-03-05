// frontend/src/components/Transfer.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ACCOUNTS_URL, TRANSFERS_URL } from '../config/api';

/**
 * ✅ FIXES:
 * 1. "From Account" loads logged-in user's own accounts (SAVINGS + CHECKING)
 * 2. "To Account" is a DROPDOWN showing all other registered accounts in the system
 *    — no more manual account number typing required
 * 3. Both dropdowns show account type, number, and balance for clarity
 * 4. Self-transfer is prevented (can't send to own accounts)
 * 5. Balance refreshes after successful transfer
 */
function Transfer() {
    const [fromAccount,   setFromAccount]   = useState('');
    const [toAccount,     setToAccount]     = useState('');
    const [amount,        setAmount]        = useState('');
    const [description,   setDescription]   = useState('');
    const [myAccounts,    setMyAccounts]    = useState([]);
    const [otherAccounts, setOtherAccounts] = useState([]);
    const [message,       setMessage]       = useState('');
    const [error,         setError]         = useState('');
    const [loading,       setLoading]       = useState(false);
    const [loadingAccts,  setLoadingAccts]  = useState(true);

    const userId = localStorage.getItem('userId');
    const token  = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchAllAccounts(); }, []);

    const fetchAllAccounts = async () => {
        setLoadingAccts(true);
        try {
            // My accounts (From dropdown)
            const myRes = await axios.get(`${ACCOUNTS_URL}/user/${userId}`, { headers });
            setMyAccounts(myRes.data);
            if (myRes.data.length > 0) setFromAccount(myRes.data[0].accountNumber);

            // All other users' accounts (To dropdown)
            const otherRes = await axios.get(`${ACCOUNTS_URL}/others/${userId}`, { headers });
            setOtherAccounts(otherRes.data);
            if (otherRes.data.length > 0) setToAccount(otherRes.data[0].accountNumber);

        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Failed to load accounts. Please refresh the page.');
        } finally {
            setLoadingAccts(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromAccount || !toAccount) { setError('Please select both accounts.'); return; }
        if (fromAccount === toAccount)  { setError('Cannot transfer to the same account.'); return; }
        const amt = parseFloat(amount);
        if (!amt || amt <= 0)           { setError('Please enter a valid amount.'); return; }

        // Check sufficient balance
        const src = myAccounts.find(a => a.accountNumber === fromAccount);
        if (src && src.balance < amt)   { setError(`Insufficient balance. Available: $${src.balance.toFixed(2)}`); return; }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.post(TRANSFERS_URL, {
                fromAccount, toAccount,
                amount: amt,
                description: description || 'Transfer'
            }, { headers });

            const msg = typeof response.data === 'string'
                ? response.data
                : response.data?.message || 'Transfer successful!';
            setMessage(msg);

            setAmount('');
            setDescription('');
            await fetchAllAccounts(); // Refresh balances

        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Transfer failed. Please try again.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    if (loadingAccts) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading accounts...</p>
            </div>
        );
    }

    // Selected "from" account object for balance display
    const selectedFrom = myAccounts.find(a => a.accountNumber === fromAccount);
    const selectedTo   = otherAccounts.find(a => a.accountNumber === toAccount);

    return (
        <div className="row justify-content-center">
            <div className="col-md-8 col-lg-7">
                <div className="card shadow-sm">
                    <div className="card-header py-3">
                        <h4 className="mb-0">💸 Send Money</h4>
                    </div>
                    <div className="card-body p-4">

                        {message && (
                            <div className="alert alert-success alert-dismissible fade show">
                                ✅ {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show">
                                ⚠ {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* FROM — logged-in user's own accounts */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">From Account</label>
                                {myAccounts.length === 0 ? (
                                    <div className="alert alert-warning mb-0">
                                        No accounts found. Please contact support or re-register.
                                    </div>
                                ) : (
                                    <select
                                        className="form-select"
                                        value={fromAccount}
                                        onChange={e => setFromAccount(e.target.value)}
                                        required
                                    >
                                        {myAccounts.map(a => (
                                            <option key={a.id} value={a.accountNumber}>
                                                {a.accountType} — {a.accountNumber} &nbsp;|&nbsp; Balance: ${parseFloat(a.balance).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {selectedFrom && (
                                    <small className="text-muted">
                                        Available balance: <strong>${parseFloat(selectedFrom.balance).toFixed(2)}</strong>
                                    </small>
                                )}
                            </div>

                            {/* TO — all other registered accounts */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">To Account</label>
                                {otherAccounts.length === 0 ? (
                                    <div className="alert alert-info mb-0">
                                        No other accounts registered in the system yet.
                                    </div>
                                ) : (
                                    <select
                                        className="form-select"
                                        value={toAccount}
                                        onChange={e => setToAccount(e.target.value)}
                                        required
                                    >
                                        {otherAccounts.map(a => (
                                            <option key={a.id} value={a.accountNumber}>
                                                {a.user?.username
                                                    ? `${a.user.username} — `
                                                    : ''}
                                                {a.accountType} — {a.accountNumber}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {selectedTo && (
                                    <small className="text-muted">
                                        Recipient: <strong>{selectedTo.user?.username || 'Unknown'}</strong> ({selectedTo.accountType})
                                    </small>
                                )}
                            </div>

                            {/* AMOUNT */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Amount ($)</label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                {selectedFrom && amount && parseFloat(amount) > parseFloat(selectedFrom.balance) && (
                                    <small className="text-danger">⚠ Amount exceeds available balance</small>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g. Rent payment, Lunch, etc."
                                    maxLength={100}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2"
                                disabled={loading || myAccounts.length === 0 || otherAccounts.length === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Processing Transfer...
                                    </>
                                ) : '💸 Send Money'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Account summary cards */}
                {myAccounts.length > 0 && (
                    <div className="mt-3">
                        <h6 className="text-muted mb-2">Your Accounts</h6>
                        <div className="row g-2">
                            {myAccounts.map(a => (
                                <div key={a.id} className="col-6">
                                    <div className="card border-0 bg-light">
                                        <div className="card-body py-2 px-3">
                                            <div className="small text-muted">{a.accountType}</div>
                                            <div className="fw-bold">${parseFloat(a.balance).toFixed(2)}</div>
                                            <div className="small text-muted">{a.accountNumber}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Transfer;
