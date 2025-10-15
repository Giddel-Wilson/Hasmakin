<!-- Authentication Layout -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Authentication - University of Port Harcourt Hostel Allocation</title>
</svelte:head>

{#if mounted}
	<div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
		<!-- Background Pattern -->
		<div class="absolute inset-0" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;); opacity: 0.1;"></div>
		
		<div class="w-full max-w-md relative z-10">
			<!-- University Header -->
			<div class="text-center mb-8">
				<div class="flex items-center justify-center mb-4">
					<div class="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
						<svg class="w-8 h-8 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
						</svg>
					</div>
				</div>
				<h1 class="text-2xl font-bold text-white mb-2">University of Port Harcourt</h1>
				<p class="text-blue-100 text-sm">Hostel Allocation System</p>
			</div>

			<!-- Auth Card -->
			<div class="bg-white rounded-2xl shadow-2xl p-8">
				<slot />
			</div>

			<!-- Footer -->
			<div class="text-center mt-6 text-blue-100 text-sm">
				<p>&copy; 2024 University of Port Harcourt</p>
				<p class="mt-1">Department of Computer Science</p>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}
	
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Poppins', system-ui, -apple-system, sans-serif;
	}
</style>
