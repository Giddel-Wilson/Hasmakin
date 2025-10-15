// Client-side authentication utilities
// University of Port Harcourt - Hostel Allocation System

import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export class ClientAuth {
  // Get access token from localStorage
  static getAccessToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('accessToken');
  }

  // Get refresh token from localStorage
  static getRefreshToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('refreshToken');
  }

  // Get user data from localStorage
  static getUser(): any | null {
    if (!browser) return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Clear all authentication data
  static clearAuth(): void {
    if (!browser) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('adminAuthenticated');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    // For now, check if we have user data in localStorage
    // The actual token validation will happen server-side via cookies
    return !!this.getUser();
  }

  // Make authenticated API request
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // For API endpoints that use cookie authentication, just include credentials
    // Don't send Authorization header for student endpoints
    const isStudentEndpoint = url.includes('/api/student/') || 
                             url.includes('/api/auth/') || 
                             url.includes('/api/applications') ||
                             url.includes('/api/hostels');
    
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Only add Authorization header for admin endpoints that expect it
    if (!isStudentEndpoint) {
      const accessToken = this.getAccessToken();
      if (accessToken) {
        headers = {
          ...headers,
          'Authorization': `Bearer ${accessToken}`
        };
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always include cookies
    });

    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && this.getRefreshToken()) {
      console.log('Got 401, attempting to refresh tokens...');
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        console.log('Tokens refreshed successfully');
        
        // Update headers with new token for non-student endpoints
        if (!isStudentEndpoint) {
          const newAccessToken = this.getAccessToken();
          if (newAccessToken) {
            headers = {
              ...headers,
              'Authorization': `Bearer ${newAccessToken}`
            };
          }
        }
        
        // Give the browser a moment to process the Set-Cookie headers
        // This ensures the new cookies are available for the retry
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Retrying original request with fresh cookies...');
        
        // Retry the original request with fresh cookies and headers
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      } else {
        console.log('Token refresh failed, but not redirecting automatically');
        // Return the 401 response instead of redirecting
        // Let the calling code decide what to do
        return response;
      }
    }

    return response;
  }

  // Refresh access token using refresh token
  static async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      
      console.log('Attempting to refresh tokens...');
      console.log('Refresh token in localStorage:', !!refreshToken);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Send refresh token in body as fallback, but server will prefer cookie
        body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        credentials: 'include' // Important: send cookies
      });

      console.log('Refresh response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Refresh successful');
        
        // Update localStorage with new tokens (for backwards compatibility)
        if (data.tokens) {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        }
        
        // Cookies are automatically updated by the server's Set-Cookie headers
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Refresh failed:', errorData);
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      // Call logout API to clear server-side cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear client-side data
      this.clearAuth();
      goto('/auth/login');
    }
  }
}
