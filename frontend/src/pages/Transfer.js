import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TwoFactorModal from '../components/TwoFactorModal';
import api from '../services/api';
import authService from '../services/auth';

function Transfer() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [formData, setFormData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: ''
    });
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorVerified, setTwoFactorVerified] = useState(false);
    
    useEffect(() => {
        fetchAccounts();
        fetchBeneficiaries();
    }, []);
    
    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };
    
    const fetchBeneficiaries = async () => {
        try {
            // Mock beneficiaries - in real app, fetch from API
            setBeneficiaries([
                { id: 2, name: 'Jane Smith', accountNumber: 'ACC-CHK-200001' },
                { id: 3, name: 'Admin User', accountNumber: 'ACC-CHK-300001' }
            ]);
        } catch (error) {
            console.error('Error fetching beneficiaries:', error);
        }
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'fromAccountId') {
            const account = accounts.find(a => a.accountId === parseInt(value));
            setSelectedAccount(account);
        }
    };
    
    const handleNext = () => {
        if (step === 1) {
            if (!formData.fromAccountId) {
                setError('Please select source account');
                return;
            }
            if (!formData.toAccountId) {
                setError('Please select destination account');
                return;
            }
            setError('');
            setStep(2);
        } else if (step === 2) {
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setError('Please enter valid amount');
                return;
            }
            if (parseFloat(formData.amount) > selectedAccount?.balance) {
                setError('Insufficient funds');
                return;
            }
            
            // Check if amount exceeds fraud threshold (5000)
            if (parseFloat(formData.amount) > 5000) {
                setRequires2FA(true);
                setShow2FA(true);
            } else {
                setStep(3);
            }
            setError('');
        }
    };
    
    const handleBack = () => {
        setStep(prev => prev - 1);
        setError('');
    };
    
    const handleTransfer = async () => {
        setLoading(true);
        setError('');
        
        try {
            const transferData = {
                ...formData,
                fromAccountId: parseInt(formData.fromAccountId),
                toAccountId: parseInt(formData.toAccountId),
                amount: parseFloat(formData.amount),
                twoFactorVerified
            };
            
            const response = await api.post('/transactions/transfer', transferData);
            setSuccess('Transfer completed successfully!');
            setStep(4);
            
            // Reset form
            setTimeout(() => {
                navigate('/transactions');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };
    
    const handle2FAVerify = (verified) => {
        setTwoFactorVerified(verified);
        setShow2FA(false);
        if (verified) {
            setStep(3);
        }
    };
    
    return (
        <div className="dashboard">
            <Navbar />
            
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card">
                            <h4 className="card-title text-center mb-4">
                                <i className="fas fa-exchange-alt me-2"></i>
                                Send Money
                            </h4>
                            
                            {/* Progress Steps */}
                            <div className="d-flex justify-content-between mb-4">
                                {[1, 2, 3, 4].map(s => (
                                    <div key={s} className="text-center">
                                        <div className={`rounded-circle bg-${step >= s ? 'primary' : 'secondary'} text-white d-inline-flex justify-content-center align-items-center`}
                                             style={{width: '30px', height: '30px'}}>
                                            {s}
                                        </div>
                                        <div className="small mt-1">
                                            {s === 1 ? 'Select' : s === 2 ? 'Amount' : s === 3 ? 'Confirm' : 'Done'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {step === 1 && (
                                <div>
                                    <div className="form-group">
                                        <label>From Account</label>
                                        <select
                                            name="fromAccountId"
                                            className="form-control"
                                            value={formData.fromAccountId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select source account</option>
                                            {accounts.map(acc => (
                                                <option key={acc.accountId} value={acc.accountId}>
                                                    {acc.accountName} - ${acc.balance.toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>To Account</label>
                                        <select
                                            name="toAccountId"
                                            className="form-control"
                                            value={formData.toAccountId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select destination account</option>
                                            {beneficiaries.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} ({b.accountNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {selectedAccount && (
                                        <div className="alert alert-info">
                                            Available Balance: ${selectedAccount.balance.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {step === 2 && (
                                <div>
                                    <div className="form-group">
                                        <label>Amount (USD)</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            className="form-control"
                                            value={formData.amount}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0.01"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Description (Optional)</label>
                                        <input
                                            type="text"
                                            name="description"
                                            className="form-control"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    
                                    {parseFloat(formData.amount) > 5000 && (
                                        <div className="alert alert-warning">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            Amount exceeds $5000. 2FA verification required.
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {step === 3 && (
                                <div>
                                    <h5 className="mb-3">Confirm Transfer Details</h5>
                                    
                                    <div className="card bg-light p-3 mb-3">
                                        <p><strong>From:</strong> {accounts.find(a => a.accountId === parseInt(formData.fromAccountId))?.accountName}</p>
                                        <p><strong>To:</strong> {beneficiaries.find(b => b.id === parseInt(formData.toAccountId))?.name}</p>
                                        <p><strong>Amount:</strong> ${parseFloat(formData.amount).toLocaleString()}</p>
                                        {formData.description && (
                                            <p><strong>Description:</strong> {formData.description}</p>
                                        )}
                                        {requires2FA && (
                                            <p className="text-success">
                                                <i className="fas fa-check-circle me-2"></i>
                                                2FA Verified
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="d-grid gap-2">
                                        <button 
                                            className="btn btn-success"
                                            onClick={handleTransfer}
                                            disabled={loading}
                                        >
                                            {loading ? <span className="loading"></span> : 'Confirm Transfer'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {step === 4 && (
                                <div className="text-center">
                                    <i className="fas fa-check-circle text-success" style={{fontSize: '4rem'}}></i>
                                    <h4 className="mt-3 text-success">Transfer Successful!</h4>
                                    <p className="text-muted">{success}</p>
                                    <p>Redirecting to transactions...</p>
                                </div>
                            )}
                            
                            {error && (
                                <div className="alert alert-danger mt-3">
                                    {error}
                                </div>
                            )}
                            
                            <div className="d-flex justify-content-between mt-4">
                                {step > 1 && step < 4 && (
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={handleBack}
                                        disabled={loading}
                                    >
                                        Back
                                    </button>
                                )}
                                
                                {step < 3 && (
                                    <button 
                                        className="btn btn-primary ms-auto"
                                        onClick={handleNext}
                                        disabled={loading}
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <TwoFactorModal
                show={show2FA}
                onClose={() => setShow2FA(false)}
                userId={user?.userId}
                onVerify={handle2FAVerify}
            />
        </div>
    );
}

export default Transfer;