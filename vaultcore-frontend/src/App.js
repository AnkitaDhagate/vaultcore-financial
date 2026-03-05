// frontend/src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transfer from './components/Transfer';
import Portfolio from './components/Portfolio';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const isAuthenticated   = () => !!localStorage.getItem('token');

    return (
        <Router>
            <div className="App">
                <Navbar onLogout={() => setToken(null)} />
                <div className="container mt-4">
                    <Routes>
                        <Route path="/login"     element={<Login onLoginSuccess={t => setToken(t)} />} />
                        <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/transfer"  element={isAuthenticated() ? <Transfer />  : <Navigate to="/login" />} />
                        <Route path="/portfolio" element={isAuthenticated() ? <Portfolio /> : <Navigate to="/login" />} />
                        <Route path="/"          element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
