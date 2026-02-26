import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

function FraudAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchAlerts();
    }, []);
    
    const fetchAlerts = async () => {
        try {
            const response = await api.get('/transactions/fraud-alerts');
            setAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };
    
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
                    <h4 className="card-title">
                        <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                        Fraud Detection Alerts
                    </h4>
                    
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Alert ID</th>
                                    <th>Transaction</th>
                                    <th>Account</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>2FA</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(alert => (
                                    <tr key={alert.alertId}>
                                        <td>#{alert.alertId}</td>
                                        <td>{alert.transactionRef}</td>
                                        <td>{alert.account?.accountNumber}</td>
                                        <td>${alert.amount.toLocaleString()}</td>
                                        <td>{alert.alertType}</td>
                                        <td>
                                            <span className={`badge ${
                                                alert.severity === 'CRITICAL' ? 'badge-danger' :
                                                alert.severity === 'HIGH' ? 'badge-danger' :
                                                'badge-warning'
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
                                        <td>{new Date(alert.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {alerts.length === 0 && (
                        <p className="text-center text-muted py-4">
                            No fraud alerts detected
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FraudAlerts;