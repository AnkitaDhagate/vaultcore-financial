import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  // Mock existing users database
  const [existingUsers, setExistingUsers] = useState([
    { 
      id: 1,
      username: 'john_doe', 
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      password: 'SecurePass123'
    },
    { 
      id: 2,
      username: 'jane_smith', 
      email: 'jane.smith@example.com',
      fullName: 'Jane Smith',
      password: 'SecurePass123'
    }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    setApiError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = 'Username must be 4-20 characters and can only contain letters, numbers, and underscores';
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters and include at least one letter, one number, and one special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    return newErrors;
  };

  const checkExistingUser = () => {
    const usernameExists = existingUsers.some(user => user.username === formData.username);
    const emailExists = existingUsers.some(user => user.email === formData.email);

    if (usernameExists) {
      return { field: 'username', message: 'Username already taken' };
    }
    if (emailExists) {
      return { field: 'email', message: 'Email already registered' };
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    setSuccessMessage('');

    // Simulate API call delay
    setTimeout(() => {
      // Check if user already exists
      const existingError = checkExistingUser();
      
      if (existingError) {
        setErrors({
          ...errors,
          [existingError.field]: existingError.message
        });
        setLoading(false);
        return;
      }

      // Create new user (in real app, this would be an API call)
      const newUser = {
        id: existingUsers.length + 1,
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password, // In real app, password would be hashed
        createdAt: new Date().toISOString(),
        accounts: []
      };

      // Add to existing users (mock database)
      existingUsers.push(newUser);

      // Generate mock tokens
      const accessToken = btoa(JSON.stringify({
        sub: newUser.id,
        username: newUser.username,
        email: newUser.email,
        type: 'ACCESS',
        exp: Date.now() + 15 * 60 * 1000
      }));

      const refreshToken = btoa(JSON.stringify({
        sub: newUser.id,
        username: newUser.username,
        type: 'REFRESH',
        exp: Date.now() + 24 * 60 * 60 * 1000
      }));

      // Show success message
      setSuccessMessage('Registration successful! Redirecting to dashboard...');

      // Store in localStorage
      setTimeout(() => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email
        }));

        setIsAuthenticated(true);
        navigate('/dashboard');
      }, 2000);

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h2>Create <span className="gradient-text">VaultCore</span> Account</h2>
        <p className="subtitle">Join secure digital banking platform</p>
      </div>

      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">
              <span className="label-icon">👤</span> Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={loading}
              className={errors.fullName ? 'error' : ''}
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">
              <span className="label-icon">📧</span> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">🔑</span> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              disabled={loading}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={loading}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <span className="label-icon">✓</span> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="form-row terms-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              disabled={loading}
            />
            <span className="checkbox-label">
              I agree to the <a href="#" className="terms-link">Terms of Service</a> and{' '}
              <a href="#" className="terms-link">Privacy Policy</a>
            </span>
          </label>
          {errors.agreeTerms && <span className="field-error">{errors.agreeTerms}</span>}
        </div>

        {apiError && <div className="error-message">{apiError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="password-requirements">
          <p className="requirements-title">Password must contain:</p>
          <ul>
            <li className={formData.password.length >= 8 ? 'valid' : ''}>
              ✓ At least 8 characters
            </li>
            <li className={/[A-Za-z]/.test(formData.password) ? 'valid' : ''}>
              ✓ At least one letter
            </li>
            <li className={/\d/.test(formData.password) ? 'valid' : ''}>
              ✓ At least one number
            </li>
            <li className={/[@$!%*#?&]/.test(formData.password) ? 'valid' : ''}>
              ✓ At least one special character (@$!%*#?&)
            </li>
          </ul>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary register-btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="login-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;