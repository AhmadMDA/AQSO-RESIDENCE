/**
 * API Configuration for AQSO Residence
 * 
 * This file centralizes API URL configuration to support
 * both local development and production deployment.
 * 
 * Set REACT_APP_API_URL environment variable for production.
 */

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Full API endpoint URL
export const API_URL = `${API_BASE_URL}/api`;

// Backend base URL (for OAuth redirects)
export const BACKEND_URL = API_BASE_URL;

export default API_URL;
