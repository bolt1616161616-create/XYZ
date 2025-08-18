// Authentication Management System
class AuthenticationManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.apiBase = '/api/auth';
        this.init();
    }

    init() {
        this.setupInterceptors();
        this.bindGlobalEvents();
    }

    setupInterceptors() {
        // Intercept all fetch requests to add auth headers
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            if (this.token && url.startsWith('/api/')) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${this.token}`
                };
            }
            
            const response = await originalFetch(url, options);
            
            // Handle 401 responses globally
            if (response.status === 401 && url !== '/api/auth/login') {
                this.handleUnauthorized();
            }
            
            return response;
        };
    }

    bindGlobalEvents() {
        // Auto-logout on tab close
        window.addEventListener('beforeunload', () => {
            if (this.token) {
                this.updateLastActivity();
            }
        });

        // Check for token expiration periodically
        setInterval(() => {
            this.checkTokenExpiration();
        }, 60000); // Check every minute
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                return { success: true, data };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Connection failed' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                return { success: true, data };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Connection failed' };
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.apiBase}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuthData();
            window.location.href = 'login.html';
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.updateLastActivity();
    }

    clearAuthData() {
        this.token = null;
        this.user = {};
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
    }

    updateLastActivity() {
        localStorage.setItem('lastActivity', Date.now().toString());
    }

    checkTokenExpiration() {
        const lastActivity = localStorage.getItem('lastActivity');
        if (!lastActivity || !this.token) return;

        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours

        if (timeSinceLastActivity > maxInactivity) {
            this.handleUnauthorized();
        }
    }

    handleUnauthorized() {
        this.clearAuthData();
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    // Utility method to check if user has specific role
    hasRole(role) {
        return this.user.role === role;
    }

    // Method to refresh user data
    async refreshUser() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${this.apiBase}/me`);
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
        return false;
    }
}

// Create global auth manager instance
window.authManager = new AuthenticationManager();

// Protected route helper
function requireAuth() {
    if (!window.authManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthenticationManager };
}