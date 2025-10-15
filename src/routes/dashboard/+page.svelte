<!-- Student Dashboard Overview -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { ClientAuth } from '$lib/auth';

	let user: any = null;
	let stats = {
		applicationStatus: 'Not Started',
		paymentStatus: 'Pending',
		allocationStatus: 'Pending',
		hostelPreference: 'None'
	};

	onMount(() => {
		user = ClientAuth.getUser();
		// Load user application data
		loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			console.log('[Dashboard Page] Loading dashboard data...');
			// Use ClientAuth.fetch to automatically include authentication headers and cookies
			const response = await ClientAuth.fetch('/api/student/dashboard');

			console.log('[Dashboard Page] Response status:', response.status);
			console.log('[Dashboard Page] Response ok:', response.ok);

			if (response.ok) {
				const data = await response.json();
				console.log('[Dashboard Page] Received data:', data);
				console.log('[Dashboard Page] Stats from API:', data.stats);
				stats = data.stats || stats;
				user = data.user || user;
				console.log('[Dashboard Page] Updated stats:', stats);
			} else {
				console.error('[Dashboard Page] API call failed with status:', response.status);
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		}
	}

	function getStatusColor(status: string) {
		switch (status.toLowerCase()) {
			case 'completed':
			case 'confirmed':
			case 'allocated':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'pending':
			case 'submitted':
				return 'bg-yellow-50 text-yellow-700 border-yellow-200';
			case 'rejected':
			case 'failed':
				return 'bg-red-50 text-red-700 border-red-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}
</script>

<div class="space-y-8">
	<!-- Welcome Section -->
	<div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl text-white p-8">
		<h1 class="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
		<p class="text-blue-100">Matric No: {user?.matricNo} | Level: {user?.level || 'Unknown'}</p>
		<p class="text-blue-100 mt-4">
			Track your hostel application progress and manage your accommodation preferences.
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid md:grid-cols-4 gap-6">
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Application</p>
					<p class="text-2xl font-bold text-gray-900 mt-2">{stats.applicationStatus}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
					</svg>
				</div>
			</div>
			<span class="inline-block px-2 py-1 text-xs font-medium rounded-full border mt-4 {getStatusColor(stats.applicationStatus)}">
				{stats.applicationStatus}
			</span>
		</div>

		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Payment</p>
					<p class="text-2xl font-bold text-gray-900 mt-2">{stats.paymentStatus}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
					</svg>
				</div>
			</div>
			<span class="inline-block px-2 py-1 text-xs font-medium rounded-full border mt-4 {getStatusColor(stats.paymentStatus)}">
				{stats.paymentStatus}
			</span>
		</div>

		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Allocation</p>
					<p class="text-2xl font-bold text-gray-900 mt-2">{stats.allocationStatus}</p>
				</div>
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
					</svg>
				</div>
			</div>
			<span class="inline-block px-2 py-1 text-xs font-medium rounded-full border mt-4 {getStatusColor(stats.allocationStatus)}">
				{stats.allocationStatus}
			</span>
		</div>

		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Preference</p>
					<p class="text-lg font-bold text-gray-900 mt-2">{stats.hostelPreference}</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Action Cards -->
	<div class="grid md:grid-cols-2 gap-8">
		<!-- Apply for Hostel -->
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-start space-x-4">
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Apply for Hostel</h3>
					<p class="text-gray-600 mb-4">
						Submit your hostel application with your preferences and special requirements.
					</p>
					<a
						href="/dashboard/apply"
						class="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
					>
						Start Application
						<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<!-- Make Payment -->
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<div class="flex items-start space-x-4">
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Pay Hostel Fees</h3>
					<p class="text-gray-600 mb-4">
						{#if stats.paymentStatus === 'Completed'}
							Your payment has been completed successfully. View payment details.
						{:else if stats.applicationStatus === 'Approved'}
							Your application has been approved. Complete payment to secure your space.
						{:else if stats.applicationStatus === 'Pending'}
							Payment will be available once your application is approved.
						{:else}
							Apply for hostel accommodation first, then make payment.
						{/if}
					</p>
					{#if stats.paymentStatus === 'Completed'}
						<a
							href="/dashboard/payments"
							class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							View Payments
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</a>
					{:else if stats.applicationStatus === 'Approved'}
						<a
							href="/dashboard/payments"
							class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
						>
							Make Payment
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</a>
					{:else}
						<button
							disabled
							class="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
						>
							Make Payment
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Activities -->
	<div class="bg-white rounded-xl shadow-sm border p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
		<div class="space-y-4">
			<div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
				<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
					</svg>
				</div>
				<div class="flex-1">
					<p class="text-sm font-medium text-gray-900">Account created successfully</p>
					<p class="text-sm text-gray-500">Welcome to the hostel allocation system</p>
				</div>
				<span class="text-sm text-gray-500">Just now</span>
			</div>
		</div>
	</div>

	<!-- Important Notices -->
	<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
		<div class="flex items-start space-x-3">
			<svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
			</svg>
			<div>
				<h4 class="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h4>
				<ul class="text-yellow-700 space-y-1 text-sm">
					<li>• Hostel allocation is based on payment verification and academic level</li>
					<li>• Applications close at the end of each semester</li>
					<li>• Ensure all information provided is accurate and up-to-date</li>
					<li>• Room confirmations must be done within 72 hours of allocation</li>
				</ul>
			</div>
		</div>
	</div>
</div>
