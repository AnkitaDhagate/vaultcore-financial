import React, { useState } from 'react';
import api from '../services/api';

function TwoFactorModal({ show, onClose, userId, onVerify }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            setError('Please enter 6-digit code');
            return;
        }
        
        setLoading(true);
        try {
            const response = await api.post('/transactions/verify-2fa', {
                userId,
                code
            });
            
            if (response.data.verified) {
                onVerify(true);
                onClose();
            } else {
                setError('Invalid code');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };
    
    if (!show) return null;
    
    return (
        <div className="modal">
            <div className="modal-content">
                <h3 className="mb-4">Two-Factor Authentication</h3>
                <p className="text-muted mb-4">
                    A verification code has been sent to your email and phone.
                </p>
                
                <div className="form-group">
                    <label>Enter 6-digit code</label>
                    <input
                        type="text"
                        className="form-control"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength="6"
                        placeholder="000000"
                        disabled={loading}
                    />
                </div>
                
                {error && <div className="error-message mb-3">{error}</div>}
                
                <div className="d-flex justify-content-end gap-2">
                    <button 
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={handleVerify}
                        disabled={loading}
                    >
                        {loading ? <span className="loading"></span> : 'Verify'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TwoFactorModal;