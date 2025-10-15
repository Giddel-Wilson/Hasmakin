<!-- Payment Verification Page -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ClientAuth } from '$lib/auth';

  let verifying = true;
  let success = false;
  let message = '';
  let paymentDetails: any = null;

  onMount(async () => {
    const reference = $page.url.searchParams.get('reference');
    
    if (!reference) {
      message = 'Invalid payment reference';
      verifying = false;
      return;
    }

    await verifyPayment(reference);
  });

  async function verifyPayment(reference: string) {
    try {
      const response = await ClientAuth.fetch(`/api/student/payments/verify?reference=${reference}`);
      const data = await response.json();

      if (response.ok && data.success) {
        success = true;
        message = data.message || 'Payment verified successfully';
        paymentDetails = data.payment;

        // Redirect to payments page after 3 seconds
        setTimeout(() => {
          goto('/dashboard/payments');
        }, 3000);
      } else {
        success = false;
        message = data.error || data.message || 'Payment verification failed';
        paymentDetails = data.payment;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      success = false;
      message = 'Failed to verify payment. Please contact support.';
    } finally {
      verifying = false;
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Payment Verification - University of Port Harcourt</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    {#if verifying}
      <!-- Loading State -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
        <p class="text-gray-600">Please wait while we verify your payment...</p>
      </div>
    {:else if success}
      <!-- Success State -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p class="text-gray-600 mb-6">{message}</p>

        {#if paymentDetails}
          <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div class="flex justify-between mb-2">
              <span class="text-sm text-gray-600">Reference:</span>
              <span class="text-sm font-medium text-gray-900">{paymentDetails.reference}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm text-gray-600">Amount:</span>
              <span class="text-sm font-medium text-gray-900">{formatCurrency(paymentDetails.amount)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Status:</span>
              <span class="text-sm font-medium text-green-600">Completed</span>
            </div>
          </div>
        {/if}

        <p class="text-sm text-gray-500">Redirecting to payments page...</p>
      </div>
    {:else}
      <!-- Error State -->
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
        <p class="text-gray-600 mb-6">{message}</p>

        {#if paymentDetails}
          <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Reference:</span>
              <span class="text-sm font-medium text-gray-900">{paymentDetails.reference}</span>
            </div>
          </div>
        {/if}

        <button
          on:click={() => goto('/dashboard/payments')}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Payments
        </button>
      </div>
    {/if}
  </div>
</div>
