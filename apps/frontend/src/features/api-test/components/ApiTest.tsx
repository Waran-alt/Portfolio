/**
 * API Test Component
 * 
 * This component tests the API configuration by making a simple health check
 * to the backend through the Nginx proxy. It helps verify that the environment
 * configuration is working correctly.
 */

'use client';

import { API_CONFIG } from '@/shared/config/app-config';
import { useState } from 'react';

interface ApiTestProps {
  /** Whether to show the test component */
  show?: boolean;
}

/**
 * API test component for verifying backend connectivity
 * 
 * This component makes a simple health check request to the backend
 * through the Nginx proxy to verify that the API configuration is
 * working correctly.
 * 
 * @param show - Whether to show the test component
 * 
 * @example
 * ```typescript
 * <ApiTest show={true} />
 * ```
 */
export default function ApiTest({ show = false }: ApiTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    url?: string;
  } | null>(null);

  const testApiConnection = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔍 ApiTest: Testing API connection', {
        healthEndpoint: API_CONFIG.ENDPOINTS.HEALTH,
        baseUrl: API_CONFIG.BASE_URL
      });

      const response = await fetch(API_CONFIG.ENDPOINTS.HEALTH);
      const data = await response.json();

      console.log('🔍 ApiTest: API response received', {
        status: response.status,
        data,
        url: API_CONFIG.ENDPOINTS.HEALTH
      });

      setResult({
        success: response.ok,
        data,
        url: API_CONFIG.ENDPOINTS.HEALTH
      });
    } catch (error) {
      console.error('🔍 ApiTest: API test failed', error);
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: API_CONFIG.ENDPOINTS.HEALTH
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="ApiTest bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 max-w-md">
      <h3 className="text-white font-semibold mb-3">API Connection Test</h3>
      
      <div className="space-y-3">
        {/* API Configuration Display */}
        <div className="text-xs text-white/70">
          <div>Base URL: {API_CONFIG.BASE_URL}</div>
          <div>Health Endpoint: {API_CONFIG.ENDPOINTS.HEALTH}</div>
        </div>

        {/* Test Button */}
        <button
          onClick={testApiConnection}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </button>

        {/* Results */}
        {result && (
          <div className={`text-sm p-3 rounded ${
            result.success 
              ? 'bg-green-500/20 border border-green-400/40 text-green-400' 
              : 'bg-red-500/20 border border-red-400/40 text-red-400'
          }`}>
            <div className="font-medium mb-1">
              {result.success ? '✅ Success' : '❌ Failed'}
            </div>
            {result.url && (
              <div className="text-xs opacity-80 mb-1">
                URL: {result.url}
              </div>
            )}
            {result.data && (
              <div className="text-xs opacity-80">
                Response: {JSON.stringify(result.data, null, 2)}
              </div>
            )}
            {result.error && (
              <div className="text-xs opacity-80">
                Error: {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 