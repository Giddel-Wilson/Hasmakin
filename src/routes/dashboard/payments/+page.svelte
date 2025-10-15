<!-- Student Payments Page -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ClientAuth } from '$lib/auth';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Input from '$lib/components/ui/input/input.svelte';

  let loading = true;
  let payments: any[] = [];
  let currentApplication: any = null;
  let canMakePayment = false;
  let showPaymentForm = false;
  let paymentAmount = '25000'; // Default hostel fee
  let processing = false;
  let message = '';
  let errorMessage = '';
  let paymentMethod = 'BANK_TRANSFER'; // Bank transfer only
  let proofOfPayment: File | null = null;
  let uploadedProofUrl = '';
  let bankDetails: any = {
    bankName: 'OPay',
    accountNumber: 'Loading...',
    accountName: 'Loading...'
  };
  
  // Payment status
  let paymentStatus: any = null;

  onMount(async () => {
    await checkPaymentStatus();
    await loadPayments();
    await loadBankDetails();
  });

  async function loadBankDetails() {
    try {
      const response = await fetch('/api/settings/bank-details');
      if (response.ok) {
        bankDetails = await response.json();
        console.log('[Payment Page] Bank details loaded:', bankDetails);
      }
    } catch (error) {
      console.error('[Payment Page] Failed to load bank details:', error);
    }
  }

  async function checkPaymentStatus() {
    try {
      const response = await ClientAuth.fetch('/api/settings/payment-status');
      if (response.ok) {
        paymentStatus = await response.json();
        console.log('[Payment Page] Payment status loaded:', paymentStatus);
      } else {
        console.error('[Payment Page] Failed to fetch payment status:', response.status);
      }
    } catch (error) {
      console.error('[Payment Page] Error checking payment status:', error);
    }
  }

  async function loadPayments() {
    try {
      loading = true;
      const response = await ClientAuth.fetch('/api/student/payments');
      
      if (response.ok) {
        const data = await response.json();
        payments = data.payments || [];
        currentApplication = data.currentApplication;
        canMakePayment = data.canMakePayment;
        console.log('[Payment Page] Payments loaded:', {
          paymentsCount: payments.length,
          hasApplication: !!currentApplication,
          canMakePayment,
          applicationStatus: currentApplication?.applicationStatus
        });
      } else {
        const errorData = await response.json();
        errorMessage = errorData.error || 'Failed to load payments';
        console.error('[Payment Page] Failed to load payments:', errorData);
      }
    } catch (error) {
      console.error('[Payment Page] Error loading payments:', error);
      errorMessage = 'Failed to load payment data';
    } finally {
      loading = false;
    }
  }

  async function makePayment() {
    console.log('[Payment Page] Make payment clicked');
    console.log('[Payment Page] Amount:', paymentAmount);
    console.log('[Payment Page] Method:', paymentMethod);
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      errorMessage = 'Please enter a valid amount';
      console.error('[Payment Page] Invalid amount');
      return;
    }

    // Proof of payment is required
    if (!proofOfPayment) {
      errorMessage = 'Please upload proof of payment';
      console.error('[Payment Page] No proof of payment');
      return;
    }

    try {
      processing = true;
      message = '';
      errorMessage = '';

      console.log('[Payment Page] Sending payment request...');

      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const response = await ClientAuth.fetch('/api/student/payments', {
          method: 'POST',
          body: JSON.stringify({
            amount: parseFloat(paymentAmount),
            paymentMethod: 'BANK_TRANSFER',
            proofOfPayment: base64,
            proofFileName: proofOfPayment?.name
          })
        });

        console.log('[Payment Page] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Payment Page] Response data:', data);
          
          message = 'Payment submitted successfully! Awaiting admin verification.';
          showPaymentForm = false;
          proofOfPayment = null;
          uploadedProofUrl = '';
          await loadPayments();
        } else {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Payment submission failed';
          console.error('[Payment Page] Payment failed:', errorData);
        }
        processing = false;
      };
      reader.readAsDataURL(proofOfPayment);
    } catch (error) {
      console.error('[Payment Page] Error making payment:', error);
      errorMessage = 'Payment processing failed';
      processing = false;
    } finally {
      console.log('[Payment Page] Processing complete');
    }
  }

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Payments - University of Port Harcourt Hostel Allocation</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Payment Management</h1>
    <p class="text-gray-600 mt-1">Manage your hostel fee payments</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Payment Status Banner -->
    {#if paymentStatus && !paymentStatus.isOpen}
      {#if paymentStatus.status === 'not_started'}
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-blue-800">
                Payment Period Not Started
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>{paymentStatus.message}</p>
                {#if paymentStatus.startDate}
                  <p class="mt-2 font-medium">
                    Opens: {new Date(paymentStatus.startDate).toLocaleString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-red-50 border border-red-200 rounded-xl p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-red-800">
                Payment Period Closed
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{paymentStatus.message}</p>
                {#if paymentStatus.deadline}
                  <p class="mt-2 font-medium">
                    Closed: {new Date(paymentStatus.deadline).toLocaleString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Messages -->
    {#if message}
      <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        {message}
      </div>
    {/if}

    {#if errorMessage}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {errorMessage}
      </div>
    {/if}

    <!-- Payment Actions -->
  {#if canMakePayment}
    <Card class="{paymentStatus && !paymentStatus.isOpen ? 'opacity-60' : ''}">
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
        <CardDescription>
          Pay your hostel accommodation fees for the current academic session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {#if !showPaymentForm}
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Application Status: <span class="font-medium text-blue-600">{currentApplication?.applicationStatus}</span>
            </p>
            <Button 
              onclick={() => {
                console.log('[Payment Page] Make Payment button clicked');
                console.log('[Payment Page] Current state:', { showPaymentForm, canMakePayment, paymentStatus });
                showPaymentForm = true;
                console.log('[Payment Page] showPaymentForm set to:', showPaymentForm);
              }}
              disabled={paymentStatus && !paymentStatus.isOpen}
            >
              {#if paymentStatus && !paymentStatus.isOpen}
                {paymentStatus.status === 'not_started' ? 'Payment Not Started' : 'Payment Closed'}
              {:else}
                Make Payment
              {/if}
            </Button>
          </div>
          {:else}
            <div class="space-y-6">
              <!-- Payment Method - Bank Transfer Only -->
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </div>
                <div class="p-4 border-2 border-blue-600 bg-blue-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    <div>
                      <div class="font-medium text-gray-900">Bank Transfer</div>
                      <div class="text-xs text-gray-500">Direct bank payment</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Amount -->
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (NGN)
                </label>
                <Input
                  id="amount"
                  type="number"
                  bind:value={paymentAmount}
                  placeholder="25000"
                  min="1"
                  step="0.01"
                  disabled={processing}
                />
                <p class="text-xs text-gray-500 mt-1">Standard hostel fee: ₦25,000</p>
              </div>

              <!-- Bank Transfer Details (shown when BANK_TRANSFER is selected) -->
              {#if paymentMethod === 'BANK_TRANSFER'}
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 class="font-medium text-blue-900 mb-3">Bank Transfer Details</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-blue-700">Bank Name:</span>
                      <span class="font-medium text-blue-900">{bankDetails.bankName}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-700">Account Number:</span>
                      <span class="font-mono font-medium text-blue-900">{bankDetails.accountNumber}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-700">Account Name:</span>
                      <span class="font-medium text-blue-900">{bankDetails.accountName}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-700">Amount:</span>
                      <span class="font-mono font-medium text-blue-900">₦{parseFloat(paymentAmount || '0').toLocaleString('en-NG')}</span>
                    </div>
                  </div>
                  <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p class="text-xs text-yellow-800">
                      <strong>Important:</strong> After making the transfer, upload your payment receipt/screenshot below for verification.
                    </p>
                  </div>
                </div>

                <!-- Proof of Payment Upload -->
                <div>
                  <label for="proof" class="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Proof (Screenshot/Receipt)
                  </label>
                  <input
                    id="proof"
                    type="file"
                    accept="image/*,.pdf"
                    onchange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        proofOfPayment = file;
                        console.log('[Payment Page] Proof uploaded:', file.name);
                      }
                    }}
                    disabled={processing}
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p class="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, PDF (Max 5MB)</p>
                </div>
              {/if}

              <div class="flex space-x-3">
                <Button 
                  onclick={makePayment} 
                  disabled={processing || (paymentMethod === 'BANK_TRANSFER' && !proofOfPayment)}
                  class="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Processing...' : paymentMethod === 'BANK_TRANSFER' ? 'Submit Payment' : 'Pay Now'}
                </Button>
                <Button 
                  variant="outline" 
                  onclick={() => {
                    showPaymentForm = false;
                    proofOfPayment = null;
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else if currentApplication}
      <div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p class="font-medium">Payment not required at this time</p>
        <p class="text-sm">Your application status: {currentApplication.applicationStatus}</p>
      </div>
    {:else}
      <div class="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">
        <p class="font-medium">No active application found</p>
        <p class="text-sm">Please submit a hostel application first before making payments.</p>
      </div>
    {/if}

    <!-- Payment History -->
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          View all your previous hostel payment transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {#if payments.length === 0}
          <div class="text-center py-8 text-gray-500">
            <p>No payment history found</p>
            <p class="text-sm">Your payments will appear here after you make them</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each payments as payment}
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <p class="font-medium text-gray-900">Payment #{payment.reference}</p>
                    <p class="text-sm text-gray-500">
                      Application ID: {payment.application.id.slice(-8)}
                    </p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium border {getStatusColor(payment.status)}">
                    {payment.status}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm text-gray-500">Amount</p>
                    <p class="font-medium">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Payment Method</p>
                    <p class="font-medium">{payment.paymentMethod}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Date</p>
                    <p class="font-medium">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>

                {#if payment.paidAt}
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <p class="text-sm text-green-600">
                      ✓ Completed on {formatDate(payment.paidAt)}
                    </p>
                  </div>
                {/if}

                {#if payment.failureReason}
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <p class="text-sm text-red-600">
                      ✗ Failed: {payment.failureReason}
                    </p>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
