import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mock users database
  const mockUsers = [
    { 
      id: 1,
      username: 'john_doe', 
      password: 'SecurePass123',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'USER'
    },
    { 
      id: 2,
      username: 'jane_smith', 
      password: 'SecurePass123',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'USER'
    },
    { 
      id: 3,
      username: 'admin', 
      password: 'Admin@123',
      fullName: 'Admin User',
      email: 'admin@vaultcore.com',
      role: 'ADMIN'
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      const user = mockUsers.find(
        u => u.username === formData.username && u.password === formData.password
      );

      if (user) {
        const accessToken = btoa(JSON.stringify({
          sub: user.id,
          username: user.username,
          role: user.role,
          type: 'ACCESS',
          exp: Date.now() + 15 * 60 * 1000
        }));

        const refreshToken = btoa(JSON.stringify({
          sub: user.id,
          username: user.username,
          type: 'REFRESH',
          exp: Date.now() + 24 * 60 * 60 * 1000
        }));

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }));

        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="login-container">
      <h2>Welcome to <span className="gradient-text">VaultCore</span></h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            disabled={loading}
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>

        <div className="auth-links">
          <Link to="/register" className="register-link">
            Don't have an account? <span>Register here</span>
          </Link>
        </div>

        <div className="test-credentials">
          <p className="label">Test Credentials:</p>
          <p>Username: john_doe / Password: SecurePass123</p>
          <p>Username: jane_smith / Password: SecurePass123</p>
        </div>
      </form>
    </div>
  );
};

export default Login;