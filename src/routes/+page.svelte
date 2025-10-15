<!-- University of Port Harcourt Hostel Allocation System - Landing Page -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let mounted = false;
	let user: any = null;

	onMount(() => {
		mounted = true;
		
		// Check if user is already logged in
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				user = JSON.parse(userData);
			} catch (e) {
				console.error('Error parsing user data:', e);
			}
		}
	});

	function navigateToAuth(path: string) {
		goto(path);
	}

	function navigateToDashboard() {
		if (user?.role === 'ADMIN') {
			goto('/admin');
		} else {
			goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>University of Port Harcourt - Hostel Allocation System</title>
	<meta name="description" content="Official hostel allocation system for University of Port Harcourt students" />
</svelte:head>

{#if mounted}
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
						<h1 class="text-lg font-semibold text-gray-900">UNIPORT Hostels</h1>
						<p class="text-xs text-gray-500">Allocation System</p>
					</div>
				</div>

				<div class="flex items-center space-x-4">
					{#if user}
						<span class="text-sm text-gray-700">Welcome, {user.name}</span>
						<button
							on:click={navigateToDashboard}
							class="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
						>
							Go to Dashboard
						</button>
					{:else}
						<button
							on:click={() => navigateToAuth('/auth/login')}
							class="text-blue-900 hover:text-blue-800 font-medium"
						>
							Login
						</button>
						<button
							on:click={() => navigateToAuth('/auth/register')}
							class="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
						>
							Register
						</button>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
			<div class="text-center">
				<div class="flex justify-center mb-8">
					<div class="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
						<svg class="w-10 h-10 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
						</svg>
					</div>
				</div>
				
				<h1 class="text-4xl md:text-6xl font-bold mb-6">
					University of Port Harcourt
				</h1>
				<h2 class="text-2xl md:text-3xl font-semibold text-yellow-400 mb-8">
					Hostel Allocation System
				</h2>
				<p class="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
					A modern, fair, and transparent system for allocating hostel accommodations to students. 
					Experience the future of student housing management.
				</p>

				{#if !user}
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							on:click={() => navigateToAuth('/auth/register')}
							class="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
						>
							Get Started
						</button>
						<button
							on:click={() => navigateToAuth('/auth/login')}
							class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
						>
							Sign In
						</button>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-20 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose Our System?</h2>
				<p class="text-xl text-gray-600">Modern features designed for fairness and transparency</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				<div class="bg-white p-6 rounded-xl shadow-sm border">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Fair Allocation</h3>
					<p class="text-gray-600">Automated allocation based on academic level, payment status, and preferences ensures fairness for all students.</p>
				</div>

				<div class="bg-white p-6 rounded-xl shadow-sm border">
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Secure Payments</h3>
					<p class="text-gray-600">Integrated Paystack payment system ensures secure and verified hostel fee payments before allocation.</p>
				</div>

				<div class="bg-white p-6 rounded-xl shadow-sm border">
					<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Real-time Updates</h3>
					<p class="text-gray-600">Track your application status in real-time with instant notifications and transparent progress tracking.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Statistics Section -->
	<section class="py-20 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Hostel Statistics</h2>
				<p class="text-xl text-gray-600">Current accommodation overview</p>
			</div>

			<div class="grid md:grid-cols-4 gap-8">
				<div class="text-center">
					<div class="text-4xl font-bold text-blue-900 mb-2">4</div>
					<div class="text-gray-600">Total Hostels</div>
				</div>
				<div class="text-center">
					<div class="text-4xl font-bold text-green-600 mb-2">1,950</div>
					<div class="text-gray-600">Total Capacity</div>
				</div>
				<div class="text-center">
					<div class="text-4xl font-bold text-yellow-600 mb-2">2</div>
					<div class="text-gray-600">Male Hostels</div>
				</div>
				<div class="text-center">
					<div class="text-4xl font-bold text-purple-600 mb-2">2</div>
					<div class="text-gray-600">Female Hostels</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Available Hostels -->
	<section class="py-20 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Available Hostels</h2>
				<p class="text-xl text-gray-600">Choose from our modern hostel facilities</p>
			</div>

			<div class="grid md:grid-cols-2 gap-8">
				<!-- Male Hostels -->
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
						<span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
						Male Hostels
					</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
							<div>
								<h4 class="font-medium text-gray-900">Alvan Ikoku Hall</h4>
								<p class="text-sm text-gray-600">North Campus • 500 capacity</p>
							</div>
							<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Available</span>
						</div>
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
							<div>
								<h4 class="font-medium text-gray-900">Professor Dike Hall</h4>
								<p class="text-sm text-gray-600">South Campus • 400 capacity</p>
							</div>
							<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Available</span>
						</div>
					</div>
				</div>

				<!-- Female Hostels -->
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
						<span class="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
						Female Hostels
					</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
							<div>
								<h4 class="font-medium text-gray-900">Eleanor Roosevelt Hall</h4>
								<p class="text-sm text-gray-600">Central Campus • 600 capacity</p>
							</div>
							<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Available</span>
						</div>
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
							<div>
								<h4 class="font-medium text-gray-900">Queen Elizabeth Hall</h4>
								<p class="text-sm text-gray-600">North Campus • 450 capacity</p>
							</div>
							<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Available</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-gray-900 text-white py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid md:grid-cols-3 gap-8">
				<div>
					<div class="flex items-center mb-4">
						<div class="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
							<svg class="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
							</svg>
						</div>
						<span class="text-lg font-semibold">UNIPORT Hostels</span>
					</div>
					<p class="text-gray-400">
						Modern hostel allocation system for University of Port Harcourt students.
					</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold mb-4">Contact</h3>
					<div class="space-y-2 text-gray-400">
						<p>University of Port Harcourt</p>
						<p>Department of Computer Science</p>
						<p>Faculty of Computing</p>
						<p>Rivers State, Nigeria</p>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold mb-4">Academic Project</h3>
					<div class="space-y-2 text-gray-400">
						<p>Final Year Project</p>
						<p>B.Sc. Computer Science</p>
						<p>By: Ademakin Angel Oluwapelumi</p>
						<p>Matric No: U2021/5570062</p>
						<p>August 2025</p>
					</div>
				</div>
			</div>

			<div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
				<p>&copy; 2024 University of Port Harcourt. All rights reserved.</p>
			</div>
		</div>
	</footer>
{/if}

<style>
	:global(body) {
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}
	
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Poppins', system-ui, -apple-system, sans-serif;
	}
</style>
