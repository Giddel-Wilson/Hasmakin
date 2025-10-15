<!-- Admin Dashboard Layout -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { ClientAuth } from '$lib/auth';
  
  let user: any = null;
  let mounted = false;
  let loading = true;
  let authError = '';
  let authChecked = false;
  
  // Get current path for active tab highlighting
  $: currentPath = $page.url.pathname;

  onMount(() => {
    mounted = true;
    // Only check auth if we haven't already checked it in this session
    if (!authChecked) {
      checkAuth();
    }
  });

  async function checkAuth() {
    if (authChecked) return; // Prevent multiple checks
    
    try {
      loading = true;
      authError = '';
      
      // Check session storage first (survives page refreshes but not browser restarts)
      const sessionAuth = sessionStorage.getItem('adminAuthenticated');
      
      if (sessionAuth === 'true' && ClientAuth.isAuthenticated()) {
        const userData = ClientAuth.getUser();
        if (userData && userData.role === 'ADMIN' && userData.email === 'admin@uniport.edu.ng') {
          user = userData;
          loading = false;
          authChecked = true;
          console.log('Using session storage - admin already authenticated');
          return;
        }
      }
      
      // Check if user is authenticated via localStorage/cookies
      if (ClientAuth.isAuthenticated()) {
        const userData = ClientAuth.getUser();
        if (userData && userData.role === 'ADMIN' && userData.email === 'admin@uniport.edu.ng') {
          user = userData;
          authChecked = true;
          sessionStorage.setItem('adminAuthenticated', 'true');
          loading = false;
          console.log('Using localStorage admin credentials - authentication successful');
          return;
        }
      }
      
      // Only redirect to login if we have no valid credentials at all
      console.log('No valid admin credentials found - redirecting to login');
      authError = 'Please log in with admin credentials';
      setTimeout(() => goto('/auth/login'), 1500);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      authError = 'Authentication error';
      setTimeout(() => goto('/auth/login'), 1500);
    } finally {
      loading = false;
    }
  }

  async function logout() {
    try {
      await ClientAuth.logout();
      sessionStorage.removeItem('adminAuthenticated');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear data manually and redirect
      ClientAuth.clearAuth();
      sessionStorage.removeItem('adminAuthenticated');
      goto('/auth/login');
    }
  }

  // Helper function to check if a tab is active
  function isActiveTab(tabPath: string): boolean {
    if (tabPath === '/admin' && currentPath === '/admin') {
      return true;
    }
    if (tabPath !== '/admin' && currentPath.startsWith(tabPath)) {
      return true;
    }
    return false;
  }
</script>

<svelte:head>
  <title>Admin Dashboard - UNIPORT HAS</title>
</svelte:head>

{#if mounted}
  {#if loading}
    <!-- Loading State -->
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
        <p class="mt-4 text-gray-600">Verifying admin access...</p>
      </div>
    </div>
  {:else if authError}
    <!-- Error State -->
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
        <p class="text-gray-600 mb-4">{authError}</p>
        <p class="text-sm text-gray-500">Redirecting to login page...</p>
      </div>
    </div>
  {:else if user}
    <!-- Authenticated Admin Content -->
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                <p class="text-sm text-gray-500">University of Port Harcourt</p>
              </div>
            </div>
          </div>

          <!-- Admin Profile -->
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{user.name}</p>
              <p class="text-xs text-gray-500">{user.matricNo} • Administrator</p>
            </div>
            <button 
              on:click={logout}
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Admin Navigation -->
    <nav class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <a 
            href="/admin" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin')}
            class:text-blue-600={isActiveTab('/admin')}
            class:border-transparent={!isActiveTab('/admin')}
            class:text-gray-500={!isActiveTab('/admin')}
          >
            Overview
          </a>
          <a 
            href="/admin/applications" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/applications')}
            class:text-blue-600={isActiveTab('/admin/applications')}
            class:border-transparent={!isActiveTab('/admin/applications')}
            class:text-gray-500={!isActiveTab('/admin/applications')}
          >
            Applications
          </a>
          <a 
            href="/admin/hostels" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/hostels')}
            class:text-blue-600={isActiveTab('/admin/hostels')}
            class:border-transparent={!isActiveTab('/admin/hostels')}
            class:text-gray-500={!isActiveTab('/admin/hostels')}
          >
            Hostels
          </a>
          <a 
            href="/admin/allocations" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/allocations')}
            class:text-blue-600={isActiveTab('/admin/allocations')}
            class:border-transparent={!isActiveTab('/admin/allocations')}
            class:text-gray-500={!isActiveTab('/admin/allocations')}
          >
            Allocations
          </a>
          <a 
            href="/admin/payments" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/payments')}
            class:text-blue-600={isActiveTab('/admin/payments')}
            class:border-transparent={!isActiveTab('/admin/payments')}
            class:text-gray-500={!isActiveTab('/admin/payments')}
          >
            Payments
          </a>
          <a 
            href="/admin/users" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/users')}
            class:text-blue-600={isActiveTab('/admin/users')}
            class:border-transparent={!isActiveTab('/admin/users')}
            class:text-gray-500={!isActiveTab('/admin/users')}
          >
            Users
          </a>
          <a 
            href="/admin/settings" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:text-gray-700 hover:border-gray-300"
            class:border-blue-500={isActiveTab('/admin/settings')}
            class:text-blue-600={isActiveTab('/admin/settings')}
            class:border-transparent={!isActiveTab('/admin/settings')}
            class:text-gray-500={!isActiveTab('/admin/settings')}
          >
            Settings
          </a>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
  {:else}
    <!-- Fallback: no user but no error either -->
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
        <p class="mt-4 text-gray-600">Initializing...</p>
      </div>
    </div>
  {/if}
{/if}
