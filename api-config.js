// API Configuration for Frontend
const API_CONFIG = {
  // Change this to your Render backend URL when deployed
  BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://your-render-app-name.onrender.com/api',
  
  // API endpoints
  ENDPOINTS: {
    // Auth
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
    
    // Investments
    INVESTMENTS: '/investments',
    INVESTMENT_STATS: '/investments/stats/summary',
    
    // Dividends
    DIVIDENDS: '/dividends',
    DIVIDEND_STATS: '/dividends/stats',
    
    // Divestments
    DIVESTMENTS: '/divestments',
    DIVESTMENT_STATS: '/divestments/stats'
  }
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, apiCall };
}
