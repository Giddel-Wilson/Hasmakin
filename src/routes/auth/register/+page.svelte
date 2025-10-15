<!-- Student Registration Page -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let formData = {
		name: '',
		email: '',
		matricNo: '',
		password: '',
		confirmPassword: ''
	};
	let loading = false;
	let errors: string[] = [];
	let showPassword = false;
	let showConfirmPassword = false;

	async function handleRegister() {
		errors = [];

		// Basic validation
		if (!formData.name || !formData.email || !formData.matricNo || !formData.password || !formData.confirmPassword) {
			errors = ['All fields are required'];
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			errors = ['Passwords do not match'];
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			if (response.ok) {
				// Store tokens and user data
				localStorage.setItem('accessToken', data.tokens.accessToken);
				localStorage.setItem('refreshToken', data.tokens.refreshToken);
				localStorage.setItem('user', JSON.stringify(data.user));

				// Redirect to dashboard
				await goto('/dashboard');
			} else {
				if (data.details && Array.isArray(data.details)) {
					errors = data.details;
				} else {
					errors = [data.error || 'Registration failed'];
				}
			}
		} catch (err) {
			errors = ['Network error. Please try again.'];
			console.error('Registration error:', err);
		} finally {
			loading = false;
		}
	}

	function formatMatricNumber(value: string) {
		// Auto-format matric number as user types
		let formatted = value.toUpperCase().replace(/[^U0-9/]/g, '');
		
		if (formatted.length > 1 && !formatted.startsWith('U')) {
			formatted = 'U' + formatted;
		}
		
		if (formatted.length > 5 && !formatted.includes('/')) {
			formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
		}
		
		if (formatted.length > 13) {
			formatted = formatted.slice(0, 13);
		}
		
		formData.matricNo = formatted;
	}

	onMount(() => {
		// Clear any existing auth data
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('user');
	});
</script>

<svelte:head>
	<title>Register - University of Port Harcourt Hostel Allocation</title>
</svelte:head>

<div class="w-full max-w-md mx-auto">
	<div class="text-center mb-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
		<p class="text-gray-600">Register for hostel allocation</p>
	</div>

	<form on:submit|preventDefault={handleRegister} class="space-y-4">
		{#if errors.length > 0}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
				{#each errors as error}
					<p>{error}</p>
				{/each}
			</div>
		{/if}

		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
				Full Name
			</label>
			<input
				type="text"
				id="name"
				bind:value={formData.name}
				placeholder="Enter your full name"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
				required
			/>
		</div>

		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
				University Email
			</label>
			<input
				type="email"
				id="email"
				bind:value={formData.email}
				placeholder="your.email@uniport.edu.ng"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
				required
			/>
			<p class="text-xs text-gray-500 mt-1">Use your official university email address</p>
		</div>

		<div>
			<label for="matricNo" class="block text-sm font-medium text-gray-700 mb-2">
				Matriculation Number
			</label>
			<input
				type="text"
				id="matricNo"
				value={formData.matricNo}
				on:input={(e) => formatMatricNumber((e.target as HTMLInputElement)?.value || '')}
				placeholder="U2021/5570062"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
				required
			/>
			<p class="text-xs text-gray-500 mt-1">Format: U2021/5570062</p>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
				Password
			</label>
			<div class="relative">
				<input
					type={showPassword ? 'text' : 'password'}
					id="password"
					bind:value={formData.password}
					placeholder="Create a strong password"
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
			<div class="text-xs text-gray-500 mt-1 space-y-1">
				<p>Password must contain:</p>
				<ul class="list-disc list-inside space-y-0.5 ml-2">
					<li>At least 8 characters</li>
					<li>One uppercase letter</li>
					<li>One lowercase letter</li>
					<li>One number</li>
					<li>One special character</li>
				</ul>
			</div>
		</div>

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
				Confirm Password
			</label>
			<div class="relative">
				<input
					type={showConfirmPassword ? 'text' : 'password'}
					id="confirmPassword"
					bind:value={formData.confirmPassword}
					placeholder="Confirm your password"
					class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
					required
				/>
				<button
					type="button"
					on:click={() => showConfirmPassword = !showConfirmPassword}
					class="absolute inset-y-0 right-0 pr-3 flex items-center"
				>
					{#if showConfirmPassword}
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
				Creating Account...
			{:else}
				Create Account
			{/if}
		</button>
	</form>

	<div class="mt-6 text-center">
		<p class="text-sm text-gray-600">
			Already have an account?
			<a href="/auth/login" class="font-medium text-blue-900 hover:text-blue-800">
				Sign in here
			</a>
		</p>
	</div>
</div>
