/**
 * API Client for communicating with the FastAPI backend
 * Handles all HTTP requests to http://localhost:8000
 */

import axios from 'axios';
import type { Project, CalculationResponse, ComplianceResult, BillOfMaterials } from '../types';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

// Use environment variable for API URL, fallback to relative path for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for logging, auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Full calculation: Validates project and calculates BOM
 * POST /calculate
 */
export const calculateProject = async (project: Project): Promise<CalculationResponse> => {
  const response = await apiClient.post<CalculationResponse>('/calculate', project);
  return response.data;
};

/**
 * Validation only: Checks code compliance without BOM calculation
 * POST /validate
 */
export const validateProject = async (project: Project): Promise<ComplianceResult[]> => {
  const response = await apiClient.post<ComplianceResult[]>('/validate', project);
  return response.data;
};

/**
 * BOM only: Calculates materials without validation
 * POST /bom
 */
export const calculateBOM = async (project: Project): Promise<BillOfMaterials> => {
  const response = await apiClient.post<BillOfMaterials>('/bom', project);
  return response.data;
};

/**
 * Health check: Verify API is online
 * GET /
 */
export const healthCheck = async (): Promise<{ status: string; service: string }> => {
  const response = await apiClient.get('/');
  return response.data;
};

export default apiClient;
