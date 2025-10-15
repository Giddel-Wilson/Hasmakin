<script lang="ts">
	import { onMount } from 'svelte';
	import { ClientAuth } from '$lib/auth';

	let statusData: any = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadStatus();
	});

	async function loadStatus() {
		try {
			console.log('Status page: Starting to load status');
			loading = true;
			
			// Use ClientAuth.fetch for proper authentication
			const response = await ClientAuth.fetch('/api/student/status');
			
			console.log('Status page: Response status:', response.status);
			
			if (!response.ok) {
				if (response.status === 401) {
					// Authentication failed, redirect to login
					window.location.href = '/auth/login';
					return;
				}
				const errorData = await response.text();
				console.log('Status page: Error response:', errorData);
				throw new Error('Failed to load status data');
			}
			
			statusData = await response.json();
			console.log('Status page: Successfully loaded status data:', statusData);
		} catch (err: any) {
			console.error('Status page: Error loading status:', err);
			error = err.message || 'Failed to load status';
		} finally {
			loading = false;
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'completed': return '✅';
			case 'in_progress': return '🔄';
			case 'pending': return '⏳';
			case 'failed': return '❌';
			default: return '◯';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed': return 'text-green-600 bg-green-50 border-green-200';
			case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
			case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'failed': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Application Status - UNIPORT Hostel Allocation</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl text-white p-8">
		<h1 class="text-3xl font-bold mb-2">Application Status</h1>
		<p class="text-blue-100">
			Track your hostel application progress and view detailed status information.
		</p>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-xl p-6">
			<div class="flex items-center space-x-3">
				<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<div>
					<h3 class="text-lg font-semibold text-red-800">Error Loading Status</h3>
					<p class="text-red-700 mt-1">{error}</p>
				</div>
			</div>
			<button
				on:click={loadStatus}
				class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
			>
				Try Again
			</button>
		</div>
	{:else if statusData}
		<!-- Progress Overview -->
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<h2 class="text-xl font-bold text-gray-900 mb-4">Progress Overview</h2>
			<div class="mb-4">
				<div class="flex justify-between text-sm text-gray-600 mb-2">
					<span>Application Progress</span>
					<span>{statusData.summary.progressPercentage}%</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-3">
					<div 
						class="bg-blue-600 h-3 rounded-full transition-all duration-500"
						style="width: {statusData.summary.progressPercentage}%"
					></div>
				</div>
			</div>
			<div class="grid md:grid-cols-4 gap-4 mt-6">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900">Account</h3>
					<p class="text-sm text-green-600">Completed</p>
				</div>
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-{statusData.summary.applicationStatus === 'APPROVED' ? 'green' : statusData.summary.applicationStatus === 'REJECTED' ? 'red' : statusData.summary.applicationStatus === 'PENDING' ? 'blue' : 'gray'}-100 rounded-full flex items-center justify-center mb-2">
						<svg class="w-8 h-8 text-{statusData.summary.applicationStatus === 'APPROVED' ? 'green' : statusData.summary.applicationStatus === 'REJECTED' ? 'red' : statusData.summary.applicationStatus === 'PENDING' ? 'blue' : 'gray'}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900">Application</h3>
					<p class="text-sm text-{statusData.summary.applicationStatus === 'APPROVED' ? 'green' : statusData.summary.applicationStatus === 'REJECTED' ? 'red' : statusData.summary.applicationStatus === 'PENDING' ? 'blue' : 'gray'}-600">{statusData.summary.applicationStatus}</p>
				</div>
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-{statusData.summary.paymentStatus === 'Completed' ? 'green' : statusData.summary.paymentStatus === 'Pending' ? 'blue' : 'gray'}-100 rounded-full flex items-center justify-center mb-2">
						<svg class="w-8 h-8 text-{statusData.summary.paymentStatus === 'Completed' ? 'green' : statusData.summary.paymentStatus === 'Pending' ? 'blue' : 'gray'}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900">Payment</h3>
					<p class="text-sm text-{statusData.summary.paymentStatus === 'Completed' ? 'green' : statusData.summary.paymentStatus === 'Pending' ? 'blue' : 'gray'}-600">{statusData.summary.paymentStatus}</p>
				</div>
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-{statusData.summary.allocationStatus === 'Allocated' ? 'green' : 'gray'}-100 rounded-full flex items-center justify-center mb-2">
						<svg class="w-8 h-8 text-{statusData.summary.allocationStatus === 'Allocated' ? 'green' : 'gray'}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900">Allocation</h3>
					<p class="text-sm text-{statusData.summary.allocationStatus === 'Allocated' ? 'green' : 'gray'}-600">{statusData.summary.allocationStatus}</p>
				</div>
			</div>
		</div>

		<!-- Current Status Summary -->
		<div class="grid md:grid-cols-2 gap-6">
			<!-- Status Cards -->
			<div class="bg-white rounded-xl shadow-sm border p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Application:</span>
						<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(statusData.summary.applicationStatus.toLowerCase())}">
							{statusData.summary.applicationStatus}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Payment:</span>
						<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(statusData.summary.paymentStatus.toLowerCase().replace(' ', '_'))}">
							{statusData.summary.paymentStatus}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Room Allocation:</span>
						<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(statusData.summary.allocationStatus.toLowerCase())}">
							{statusData.summary.allocationStatus}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Hostel Preference:</span>
						<span class="font-medium">{statusData.summary.hostelPreference}</span>
					</div>
				</div>
			</div>

			<!-- Room Details (if allocated) -->
			{#if statusData.summary.roomDetails}
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Room Assignment</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Hostel:</span>
							<span class="font-medium">{statusData.summary.roomDetails.hostel}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Room Number:</span>
							<span class="font-medium">{statusData.summary.roomDetails.roomNumber}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Room Type:</span>
							<span class="font-medium capitalize">{statusData.summary.roomDetails.type.toLowerCase()}</span>
						</div>
					</div>
				</div>
			{:else}
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
					<div class="space-y-3">
						{#if statusData.summary.applicationStatus === 'Not Submitted'}
							<div class="flex items-center space-x-3 text-blue-600">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
								<span>Submit your hostel application</span>
							</div>
						{:else if statusData.summary.applicationStatus === 'PENDING'}
							<div class="flex items-center space-x-3 text-yellow-600">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span>Wait for application review</span>
							</div>
						{:else if statusData.summary.applicationStatus === 'APPROVED' && statusData.summary.paymentStatus !== 'Completed'}
							<div class="flex items-center space-x-3 text-green-600">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
								</svg>
								<span>Complete payment to secure your space</span>
							</div>
						{:else if statusData.summary.paymentStatus === 'Completed' && statusData.summary.allocationStatus !== 'Allocated'}
							<div class="flex items-center space-x-3 text-purple-600">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
								</svg>
								<span>Awaiting room allocation</span>
							</div>
						{:else}
							<div class="flex items-center space-x-3 text-green-600">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
								<span>All steps completed!</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Timeline -->
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-6">Application Timeline</h3>
			<div class="space-y-6">
				{#each statusData.timeline as event, index}
					<div class="flex items-start space-x-4">
						<!-- Timeline indicator -->
						<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {event.status === 'completed' ? 'bg-green-100' : event.status === 'in_progress' ? 'bg-blue-100' : event.status === 'pending' ? 'bg-gray-100' : 'bg-red-100'}">
							<span class="text-lg">
								{#if event.icon === 'user'}
									👤
								{:else if event.icon === 'document'}
									📄
								{:else if event.icon === 'review'}
									🔍
								{:else if event.icon === 'payment'}
									💳
								{:else if event.icon === 'home'}
									🏠
								{:else}
									{getStatusIcon(event.status)}
								{/if}
							</span>
						</div>
						
						<!-- Timeline content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between">
								<h4 class="text-sm font-semibold text-gray-900">{event.title}</h4>
								<time class="text-xs text-gray-500">{formatDate(event.date)}</time>
							</div>
							<p class="text-sm text-gray-600 mt-1">{event.description}</p>
							
							<!-- Additional details -->
							{#if event.details}
								<div class="mt-3 bg-gray-50 rounded-lg p-3">
									<h5 class="text-xs font-semibold text-gray-700 mb-2">Details</h5>
									<div class="grid grid-cols-1 gap-2 text-xs text-gray-600">
										{#if event.details.hostelPreference}
											<div><span class="font-medium">Hostel:</span> {event.details.hostelPreference}</div>
										{/if}
										{#if event.details.amount}
											<div><span class="font-medium">Amount:</span> {formatCurrency(event.details.amount)}</div>
										{/if}
										{#if event.details.reference}
											<div><span class="font-medium">Reference:</span> {event.details.reference}</div>
										{/if}
										{#if event.details.hostelName}
											<div><span class="font-medium">Hostel:</span> {event.details.hostelName}</div>
											<div><span class="font-medium">Room:</span> {event.details.roomNumber}</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
						
						<!-- Connecting line -->
						{#if index < statusData.timeline.length - 1}
							<div class="absolute left-5 mt-10 w-0.5 h-6 bg-gray-200"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="bg-white rounded-xl shadow-sm border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
			<div class="flex flex-wrap gap-4">
				{#if statusData.summary.applicationStatus === 'Not Submitted'}
					<a
						href="/dashboard/apply"
						class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						Submit Application
					</a>
				{:else if statusData.summary.applicationStatus === 'APPROVED' && statusData.summary.paymentStatus !== 'Completed'}
					<a
						href="/dashboard/payments"
						class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
						</svg>
						Make Payment
					</a>
				{/if}
				
				<a
					href="/dashboard/settings"
					class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
					</svg>
					Settings
				</a>
				
				<button
					on:click={loadStatus}
					class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					Refresh Status
				</button>
			</div>
		</div>
	{/if}
</div>
