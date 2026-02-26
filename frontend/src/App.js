import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import FraudAlerts from './pages/FraudAlerts';
import './index.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/accounts" element={
                    <PrivateRoute>
                        <Accounts />
                    </PrivateRoute>
                } />
                <Route path="/transfer" element={
                    <PrivateRoute>
                        <Transfer />
                    </PrivateRoute>
                } />
                <Route path="/transactions" element={
                    <PrivateRoute>
                        <Transactions />
                    </PrivateRoute>
                } />
                <Route path="/fraud-alerts" element={
                    <PrivateRoute>
                        <FraudAlerts />
                    </PrivateRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;