<!-- Demo Payment Page (for testing without Paystack keys) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let reference = '';
  let amount = 0;
  let processing = false;

  onMount(() => {
    reference = $page.url.searchParams.get('reference') || '';
    amount = parseFloat($page.url.searchParams.get('amount') || '0');
  });

  async function simulateSuccess() {
    processing = true;
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    goto(`/dashboard/payments/verify?reference=${reference}`);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Demo Payment - UNIPORT Hostel System</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Demo Payment Gateway</h1>
      <p class="text-sm text-gray-600">This is a demo payment page for testing</p>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <div class="text-sm text-yellow-800">
          <p class="font-medium">Demo Mode Active</p>
          <p class="mt-1">Paystack API keys not configured. Using demo payment flow.</p>
        </div>
      </div>
    </div>

    <div class="space-y-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">Amount:</span>
          <span class="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Reference:</span>
          <span class="text-sm font-medium text-gray-900">{reference}</span>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-4">
        <p class="text-sm text-gray-600 mb-4">
          In production, this page would be replaced by the actual Paystack checkout page.
        </p>
        <p class="text-xs text-gray-500 mb-4">
          To use real payments, add valid Paystack API keys to your .env file.
        </p>
      </div>
    </div>

    <div class="space-y-3">
      <button
        on:click={simulateSuccess}
        disabled={processing}
        class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {#if processing}
          <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        {:else}
          ✓ Simulate Successful Payment
        {/if}
      </button>

      <button
        on:click={() => goto('/dashboard/payments')}
        class="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>

    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500">
        University of Port Harcourt Hostel Allocation System
      </p>
    </div>
  </div>
</div>
