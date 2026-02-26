import api from './api';

class AuthService {
    async login(username, password) {
        try {
            console.log('Attempting login for:', username);
            const response = await api.post('/auth/login', { username, password });
            console.log('Login response:', response.data);
            
            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error.response?.data || { error: 'Login failed' };
        }
    }
    
    async register(userData) {
        try {
            console.log('Registering user:', userData.username);
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error.response?.data || { error: 'Registration failed' };
        }
    }
    
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await api.post('/auth/logout', { refreshToken });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            window.location.href = '/login';
        }
    }
    
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }
}

export default new AuthService();