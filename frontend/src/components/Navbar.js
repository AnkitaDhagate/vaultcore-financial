import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';

function Navbar() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };
    
    return (
        <nav className="navbar">
            <div className="container-fluid">
                <Link to="/dashboard" className="navbar-brand">
                    <i className="fas fa-shield-alt me-2"></i>
                    VaultCore Financial
                </Link>
                
                <div className="d-flex align-items-center">
                    <Link to="/dashboard" className="nav-link">
                        <i className="fas fa-home me-1"></i> Dashboard
                    </Link>
                    <Link to="/accounts" className="nav-link">
                        <i className="fas fa-wallet me-1"></i> Accounts
                    </Link>
                    <Link to="/transfer" className="nav-link">
                        <i className="fas fa-exchange-alt me-1"></i> Transfer
                    </Link>
                    <Link to="/transactions" className="nav-link">
                        <i className="fas fa-history me-1"></i> History
                    </Link>
                    
                    <span className="nav-link text-primary">
                        <i className="fas fa-user me-1"></i>
                        {user?.fullName}
                    </span>
                    
                    <button 
                        onClick={handleLogout}
                        className="btn btn-outline-danger ms-3"
                    >
                        <i className="fas fa-sign-out-alt me-1"></i> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;