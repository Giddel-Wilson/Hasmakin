<!-- Student Dashboard Layout -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { ClientAuth } from '$lib/auth';

	let user: any = null;
	let mounted = false;
	let authChecked = false;

	onMount(async () => {
		mounted = true;
		await checkAuth();
	});

	async function checkAuth() {
		try {
			// Check if user is authenticated via localStorage
			if (!ClientAuth.isAuthenticated()) {
				console.log('No authentication found in localStorage');
				goto('/auth/login');
				return;
			}

			user = ClientAuth.getUser();
			console.log('User from localStorage:', user);

			// For student users, verify cookies work by testing profile endpoint
			if (user.role === 'STUDENT') {
				try {
					console.log('Verifying student authentication with server...');
					const response = await fetch('/api/student/profile', {
						credentials: 'include'
					});
					
					if (!response.ok) {
						console.log('Student auth verification failed, status:', response.status);
						
						// Try to refresh tokens if we have a refresh token
						if (response.status === 401) {
							console.log('Attempting token refresh...');
							const refreshed = await ClientAuth.refreshTokens();
							if (refreshed) {
								console.log('Token refresh successful, retrying verification...');
								// Retry verification after refresh
								const retryResponse = await fetch('/api/student/profile', {
									credentials: 'include'
								});
								if (!retryResponse.ok) {
									console.log('Verification still failed after refresh');
									logout();
									return;
								}
							} else {
								console.log('Token refresh failed');
								logout();
								return;
							}
						} else {
							logout();
							return;
						}
					}
					console.log('Student authentication verified successfully');
				} catch (error) {
					console.error('Student auth verification error:', error);
					// Don't logout on network errors, continue with localStorage data
					console.log('Continuing with localStorage data due to network error');
				}
			}
			
			// For admin users, verify with server
			else if (user.role === 'ADMIN') {
				try {
					const response = await fetch('/api/auth/verify');
					if (!response.ok) {
						console.log('Admin auth verification failed');
						logout();
						return;
					}
				} catch (error) {
					console.error('Auth verification error:', error);
					// Don't logout on network errors, continue with localStorage data
				}
			}

			authChecked = true;
		} catch (error) {
			console.error('Auth check failed:', error);
			goto('/auth/login');
		}
	}

	async function logout() {
		await ClientAuth.logout();
	}

	$: currentPath = $page.url.pathname;
</script>

<svelte:head>
	<title>Student Dashboard - University of Port Harcourt Hostel Allocation</title>
</svelte:head>

{#if mounted && authChecked && user}
	<div class="min-h-screen bg-gray-50">
		<!-- Navigation -->
		<nav class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<div class="flex items-center">
						<div class="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
							<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
							</svg>
						</div>
						<div>
							<h1 class="text-lg font-semibold text-gray-900">Student Dashboard</h1>
							<p class="text-xs text-gray-500">UNIPORT Hostel System</p>
						</div>
					</div>

					<div class="flex items-center space-x-4">
						<div class="text-right">
							<p class="text-sm font-medium text-gray-900">{user.name}</p>
							<p class="text-xs text-gray-500">{user.matricNo}</p>
						</div>
						<button
							on:click={logout}
							class="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
							title="Logout"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</nav>

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Quick Navigation -->
			<div class="mb-8">
				<nav class="flex space-x-8" aria-label="Tabs">
					<a
						href="/dashboard"
						class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
						{currentPath === '/dashboard' ? 'border-blue-900 text-blue-900' : ''}"
					>
						Overview
					</a>
					<a
						href="/dashboard/apply"
						class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
						{currentPath === '/dashboard/apply' ? 'border-blue-900 text-blue-900' : ''}"
					>
						Apply for Hostel
					</a>
					<a
						href="/dashboard/status"
						class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
						{currentPath === '/dashboard/status' ? 'border-blue-900 text-blue-900' : ''}"
					>
						Application Status
					</a>
					<a
						href="/dashboard/payments"
						class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
						{currentPath === '/dashboard/payments' ? 'border-blue-900 text-blue-900' : ''}"
					>
						Payment
					</a>
					<a
						href="/dashboard/settings"
						class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
						{currentPath === '/dashboard/settings' ? 'border-blue-900 text-blue-900' : ''}"
					>
						Profile Settings
					</a>
				</nav>
			</div>

			<!-- Content -->
			<slot />
		</div>
	</div>
{/if}
