<!-- Student Login Page -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let identifier = '';
	let password = '';
	let loading = false;
	let error = '';
	let showPassword = false;

	const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard';

	async function handleLogin() {
		if (!identifier || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include', // Important: include cookies
				body: JSON.stringify({ identifier, password })
			});

			const data = await response.json();

			if (response.ok) {
				// Store tokens for client-side auth checks
				// Note: Server also sets HTTP-only cookies
				const accessToken = data.accessToken || data.tokens?.accessToken;
				const refreshToken = data.refreshToken || data.tokens?.refreshToken;
				
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken);
				}
				if (refreshToken) {
					localStorage.setItem('refreshToken', refreshToken);
				}
				localStorage.setItem('user', JSON.stringify(data.user));

				// Set session authentication flag for admins
				if (data.user.role === 'ADMIN') {
					sessionStorage.setItem('adminAuthenticated', 'true');
				}

				console.log('Login successful, user:', data.user);

				// Redirect based on role
				if (data.user.role === 'ADMIN') {
					await goto('/admin');
				} else {
					await goto(redirectTo);
				}
			} else {
				error = data.error || 'Login failed';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}

	onMount(() => {
		// Clear any existing auth data
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('user');
	});
</script>

<svelte:head>
	<title>Login - University of Port Harcourt Hostel Allocation</title>
</svelte:head>

<div class="w-full max-w-sm mx-auto">
	<div class="text-center mb-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
		<p class="text-gray-600">Sign in to your hostel allocation account</p>
	</div>

	<form on:submit|preventDefault={handleLogin} class="space-y-4">
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
				{error}
			</div>
		{/if}

		<div>
			<label for="identifier" class="block text-sm font-medium text-gray-700 mb-2">
				Email or Matric Number
			</label>
			<input
				type="text"
				id="identifier"
				bind:value={identifier}
				on:keypress={handleKeyPress}
				placeholder="Enter your email or matric number"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
				required
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
				Password
			</label>
			<div class="relative">
				<input
					type={showPassword ? 'text' : 'password'}
					id="password"
					bind:value={password}
					on:keypress={handleKeyPress}
					placeholder="Enter your password"
					class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
					required
				/>
				<button
					type="button"
					on:click={() => showPassword = !showPassword}
					class="absolute inset-y-0 right-0 pr-3 flex items-center"
				>
					{#if showPassword}
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L19.071 19.071"></path>
						</svg>
					{:else}
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
		>
			{#if loading}
				<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Signing in...
			{:else}
				Sign In
			{/if}
		</button>
	</form>

	<div class="mt-6 text-center">
		<p class="text-sm text-gray-600">
			Don't have an account?
			<br>
			<a href="/auth/register" class="font-medium text-blue-900 hover:text-blue-800">
				Register here
			</a>
		</p>
	</div>

	<!-- Admin Login Link -->
	<!-- <div class="mt-4 pt-4 border-t border-gray-200 text-center">
		<p class="text-xs text-gray-500">
			Admin? <a href="/auth/admin-login" class="text-blue-900 hover:text-blue-800 font-medium">Admin Login</a>
		</p>
	</div> -->
</div>
