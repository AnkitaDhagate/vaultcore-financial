// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ onLogout }) {
    const navigate = useNavigate();
    const token    = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        ['token','refreshToken','username','userId','role'].forEach(k => localStorage.removeItem(k));
        if (onLogout) onLogout();
        navigate('/login');
    };

    if (!token) return null;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
                <Link className="navbar-brand" to="/dashboard">VaultCore Financial</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/transfer">Transfer</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/portfolio">Portfolio</Link></li>
                    </ul>
                    <span className="navbar-text me-3">Welcome, {username}!</span>
                    <button className="btn btn-light" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
