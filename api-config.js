// API Configuration for Secure Netlify Functions
// This file configures the secure API endpoint for embassy information

// API endpoint configuration
window.API_CONFIG = {
    // Use Netlify Functions for secure API calls
    EMBASSY_INFO_ENDPOINT: '/.netlify/functions/embassy-info',
    
    // Enable secure mode (API calls go through Netlify Functions)
    SECURE_MODE: true
};

// Note: API keys are now securely stored in Netlify environment variables
// and accessed only by server-side functions, never exposed to browsers