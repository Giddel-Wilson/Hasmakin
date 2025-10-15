<!-- Admin Settings -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';

  let loading = false;
  let error = '';
  let success = '';
  
  // Modal states
  let showRunAlgorithmModal = false;
  let runningAlgorithm = false;
  
  let showResetModal = false;
  let resetCategory = '';
  let resettingSettings = false;

  // System Settings
  let systemSettings = {
    application_start_date: '',
    application_deadline: '',
    payment_start_date: '',
    payment_deadline: '',
    allocation_start_date: '',
    allocation_date: '',
    allowLateApplications: false,
    requirePaymentForAllocation: true,
    maxApplicationsPerStudent: 1,
    systemMaintenanceMode: false,
    registration_open: true
  };

  // Allocation Settings
  let allocationSettings = {
    priorityByLevel: true,
    priorityByGPA: false,
    priorityByDistance: false,
    priorityByDisability: true,
    gpaWeight: 30,
    levelWeight: 40,
    distanceWeight: 20,
    disabilityWeight: 10,
    maxRoomOccupancy: 4,
    allowGenderMixing: false,
    autoAllocation: true
  };

  // Payment Settings
  let paymentSettings = {
    maleHallAFee: 45000,
    maleHallBFee: 50000,
    femaleHallAFee: 48000,
    femaleHallBFee: 52000,
    lateFee: 5000,
    processingFee: 1000,
    enableOnlinePayment: true,
    enableBankTransfer: true,
    enableUSSD: true,
    enableMobileMoney: true,
    paystackPublicKey: '',
    paystackSecretKey: '',
    flutterwavePublicKey: '',
    flutterwaveSecretKey: ''
  };

  // Email Settings
  let emailSettings = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@uniport.edu.ng',
    fromName: 'UNIPORT Hostel System',
    enableEmailNotifications: true
  };

  // Notification Settings
  let notificationSettings = {
    applicationReceived: true,
    applicationApproved: true,
    applicationRejected: true,
    allocationAssigned: true,
    paymentReceived: true,
    paymentConfirmed: true,
    deadlineReminders: true,
    systemMaintenance: true
  };

  // Active tab
  let activeTab = 'system';

  onMount(async () => {
    await loadSettings();
  });

  async function loadSettings() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/settings');
      if (response.ok) {
        const settings = await response.json();
        
        // Convert ISO date strings to datetime-local format for the inputs
        if (settings.system) {
          const dateFields = ['application_start_date', 'application_deadline', 'payment_start_date', 'payment_deadline', 'allocation_start_date', 'allocation_date'];
          dateFields.forEach(field => {
            if (settings.system[field]) {
              const value = settings.system[field];
              // If it's an ISO string with timezone, convert to local datetime-local format
              if (typeof value === 'string' && (value.includes('Z') || value.includes('T'))) {
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    // Format as YYYY-MM-DDTHH:mm for datetime-local input
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    settings.system[field] = `${year}-${month}-${day}T${hours}:${minutes}`;
                  }
                } catch (e) {
                  console.warn(`Failed to parse date for ${field}:`, value);
                }
              }
            }
          });
        }
        
        systemSettings = { ...systemSettings, ...settings.system };
        allocationSettings = { ...allocationSettings, ...settings.allocation };
        paymentSettings = { ...paymentSettings, ...settings.payment };
        emailSettings = { ...emailSettings, ...settings.email };
        notificationSettings = { ...notificationSettings, ...settings.notifications };
      } else {
        error = 'Failed to load settings';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      error = 'Failed to load settings';
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  async function saveSettings(category: string) {
    try {
      loading = true;
      error = '';

      // Convert datetime-local values to proper ISO strings
      const convertedSystemSettings = { ...systemSettings };
      const dateFields = ['application_start_date', 'application_deadline', 'payment_start_date', 'payment_deadline', 'allocation_start_date', 'allocation_date'];
      
      dateFields.forEach(field => {
        if (convertedSystemSettings[field]) {
          const localDateTime = convertedSystemSettings[field];
          // datetime-local gives us "2025-10-11T23:00" in LOCAL timezone
          // Convert to full ISO string: create Date object (interprets as local), then get ISO string
          if (localDateTime && typeof localDateTime === 'string' && !localDateTime.includes('Z')) {
            // Add seconds if missing, then convert to Date in local timezone, then to ISO
            const dateTimeWithSeconds = localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
            const date = new Date(dateTimeWithSeconds);
            if (!isNaN(date.getTime())) {
              convertedSystemSettings[field] = date.toISOString();
            }
          }
        }
      });

      // Prepare all settings data for the API
      const allSettings = {
        system: convertedSystemSettings,
        allocation: allocationSettings,
        payment: paymentSettings,
        email: emailSettings,
        notifications: notificationSettings
      };

      const response = await ClientAuth.fetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(allSettings)
      });

      if (response.ok) {
        success = `${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully`;
        setTimeout(() => success = '', 3000);
        // Reload settings to get the converted values
        await loadSettings();
      } else {
        const errorData = await response.json();
        error = errorData.error || `Failed to save ${category} settings`;
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      console.error('Save settings error:', err);
      error = `Failed to save ${category} settings`;
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  async function testEmailConnection() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify(emailSettings)
      });

      if (response.ok) {
        success = 'Email connection test successful!';
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Email connection test failed';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Email connection test failed';
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  async function testPaymentGateway(gateway: string) {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch(`/api/admin/settings/test-payment/${gateway}`, {
        method: 'POST',
        body: JSON.stringify(paymentSettings)
      });

      if (response.ok) {
        success = `${gateway} connection test successful!`;
        setTimeout(() => success = '', 3000);
      } else {
        error = `${gateway} connection test failed`;
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = `${gateway} connection test failed`;
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  async function saveAllSettings() {
    try {
      loading = true;
      error = '';

      // Prepare all settings data for the API
      const allSettings = {
        system: systemSettings,
        allocation: allocationSettings,
        payment: paymentSettings,
        email: emailSettings,
        notifications: notificationSettings
      };

      const response = await ClientAuth.fetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(allSettings)
      });

      if (response.ok) {
        success = 'All settings saved successfully!';
        setTimeout(() => success = '', 3000);
      } else {
        const errorData = await response.json();
        error = errorData.error || 'Failed to save settings';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      console.error('Save all settings error:', err);
      error = 'Failed to save all settings';
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  function openRunAlgorithmModal() {
    showRunAlgorithmModal = true;
  }

  function closeRunAlgorithmModal() {
    showRunAlgorithmModal = false;
  }

  async function runAllocationAlgorithm() {
    try {
      runningAlgorithm = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/allocations/run-algorithm', {
        method: 'POST',
        body: JSON.stringify(allocationSettings)
      });

      if (response.ok) {
        success = 'Allocation algorithm completed successfully';
        setTimeout(() => success = '', 3000);
        closeRunAlgorithmModal();
      } else {
        error = 'Failed to run allocation algorithm';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to run allocation algorithm';
      setTimeout(() => error = '', 3000);
    } finally {
      runningAlgorithm = false;
    }
  }

  async function sendTestNotification() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/settings/test-notification', {
        method: 'POST',
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        success = 'Test notification sent successfully!';
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Failed to send test notification';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to send test notification';
      setTimeout(() => error = '', 3000);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  function openResetModal(category: string) {
    resetCategory = category;
    showResetModal = true;
  }

  function closeResetModal() {
    showResetModal = false;
    resetCategory = '';
  }

  function resetToDefaults() {
    if (!resetCategory) return;

    resettingSettings = true;
    
    switch (resetCategory) {
      case 'system':
        systemSettings = {
          applicationDeadline: '',
          allocationDate: '',
          paymentDeadline: '',
          allowLateApplications: false,
          requirePaymentForAllocation: true,
          maxApplicationsPerStudent: 1,
          systemMaintenanceMode: false,
          registrationOpen: true
        };
        break;
      case 'allocation':
        allocationSettings = {
          priorityByLevel: true,
          priorityByGPA: false,
          priorityByDistance: false,
          priorityByDisability: true,
          gpaWeight: 30,
          levelWeight: 40,
          distanceWeight: 20,
          disabilityWeight: 10,
          maxRoomOccupancy: 4,
          allowGenderMixing: false,
          autoAllocation: true
        };
        break;
      case 'payment':
        paymentSettings = {
          ...paymentSettings,
          maleHallAFee: 45000,
          maleHallBFee: 50000,
          femaleHallAFee: 48000,
          femaleHallBFee: 52000,
          lateFee: 5000,
          processingFee: 1000,
          enableOnlinePayment: true,
          enableBankTransfer: true,
          enableUSSD: true,
          enableMobileMoney: true
        };
        break;
    }

    resettingSettings = false;
    success = `${resetCategory} settings reset to defaults`;
    setTimeout(() => success = '', 3000);
    closeResetModal();
  }
</script>

<svelte:head>
  <title>System Settings - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8">
  <h1 class="text-2xl font-bold text-gray-900">System Settings</h1>
  <p class="text-gray-600">Configure system parameters, allocation rules, and integrations</p>
</div>

<!-- Success/Error Messages -->
{#if success}
  <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
    {success}
  </div>
{/if}

{#if error}
  <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    {error}
  </div>
{/if}

<!-- Global Save Button -->
<div class="mb-6 flex justify-end">
  <button
    on:click={() => saveAllSettings()}
    disabled={loading}
    class="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
    {#if loading}
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    {loading ? 'Saving All Settings...' : 'Save All Settings'}
  </button>
</div>

<!-- Tabs -->
<div class="border-b border-gray-200 mb-6">
  <nav class="-mb-px flex space-x-8">
    <button
      on:click={() => activeTab = 'system'}
      class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'system' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    >
      System
    </button>
    <button
      on:click={() => activeTab = 'allocation'}
      class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'allocation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    >
      Allocation
    </button>
    <button
      on:click={() => activeTab = 'payment'}
      class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'payment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    >
      Payment
    </button>
    <button
      on:click={() => activeTab = 'email'}
      class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'email' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    >
      Email
    </button>
    <button
      on:click={() => activeTab = 'notifications'}
      class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'notifications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    >
      Notifications
    </button>
  </nav>
</div>

<!-- System Settings Tab -->
{#if activeTab === 'system'}
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">System Configuration</h2>
      <div class="flex space-x-3">
        <button
          on:click={() => openResetModal('system')}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Reset to Defaults
        </button>
        <button
          on:click={() => saveSettings('system')}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label for="applicationStartDate" class="block text-sm font-medium text-gray-700 mb-2">
          Application Start Date
        </label>
        <input
          type="datetime-local"
          id="applicationStartDate"
          bind:value={systemSettings.application_start_date}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="applicationDeadline" class="block text-sm font-medium text-gray-700 mb-2">
          Application Deadline
        </label>
        <input
          type="datetime-local"
          id="applicationDeadline"
          bind:value={systemSettings.application_deadline}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="paymentStartDate" class="block text-sm font-medium text-gray-700 mb-2">
          Payment Start Date
        </label>
        <input
          type="datetime-local"
          id="paymentStartDate"
          bind:value={systemSettings.payment_start_date}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="paymentDeadline" class="block text-sm font-medium text-gray-700 mb-2">
          Payment Deadline
        </label>
        <input
          type="datetime-local"
          id="paymentDeadline"
          bind:value={systemSettings.payment_deadline}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="allocationStartDate" class="block text-sm font-medium text-gray-700 mb-2">
          Allocation Start Date
        </label>
        <input
          type="datetime-local"
          id="allocationStartDate"
          bind:value={systemSettings.allocation_start_date}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="allocationDate" class="block text-sm font-medium text-gray-700 mb-2">
          Allocation Deadline
        </label>
        <input
          type="datetime-local"
          id="allocationDate"
          bind:value={systemSettings.allocation_date}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="maxApplications" class="block text-sm font-medium text-gray-700 mb-2">
          Max Applications per Student
        </label>
        <input
          type="number"
          id="maxApplications"
          bind:value={systemSettings.maxApplicationsPerStudent}
          min="1"
          max="5"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="mt-6 space-y-4">
      <div class="flex items-center">
        <input
          type="checkbox"
          id="registrationOpen"
          bind:checked={systemSettings.registration_open}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="registrationOpen" class="ml-2 block text-sm text-gray-900">
          Registration Open
        </label>
      </div>

      <!-- <div class="flex items-center">
        <input
          type="checkbox"
          id="allowLateApplications"
          bind:checked={systemSettings.allowLateApplications}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="allowLateApplications" class="ml-2 block text-sm text-gray-900">
          Allow Late Applications
        </label>
      </div> -->

      <div class="flex items-center">
        <input
          type="checkbox"
          id="requirePayment"
          bind:checked={systemSettings.requirePaymentForAllocation}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="requirePayment" class="ml-2 block text-sm text-gray-900">
          Require Payment for Allocation
        </label>
      </div>

      <!-- <div class="flex items-center">
        <input
          type="checkbox"
          id="maintenanceMode"
          bind:checked={systemSettings.systemMaintenanceMode}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="maintenanceMode" class="ml-2 block text-sm text-gray-900">
          System Maintenance Mode
        </label>
      </div> -->
    </div>
  </div>
{/if}

<!-- Allocation Settings Tab -->
{#if activeTab === 'allocation'}
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">Allocation Algorithm</h2>
      <div class="flex space-x-3">
        <button
          on:click={openRunAlgorithmModal}
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
        >
          Run Algorithm
        </button>
        <button
          on:click={() => openResetModal('allocation')}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Reset to Defaults
        </button>
        <button
          on:click={() => saveSettings('allocation')}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Priority Factors -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Priority Factors</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <input
              type="checkbox"
              id="priorityByLevel"
              bind:checked={allocationSettings.priorityByLevel}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="priorityByLevel" class="ml-2 block text-sm text-gray-900">
              Prioritize by Academic Level
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="priorityByGPA"
              bind:checked={allocationSettings.priorityByGPA}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="priorityByGPA" class="ml-2 block text-sm text-gray-900">
              Prioritize by GPA
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="priorityByDistance"
              bind:checked={allocationSettings.priorityByDistance}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="priorityByDistance" class="ml-2 block text-sm text-gray-900">
              Prioritize by Distance from Home
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="priorityByDisability"
              bind:checked={allocationSettings.priorityByDisability}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="priorityByDisability" class="ml-2 block text-sm text-gray-900">
              Prioritize Students with Disabilities
            </label>
          </div>
        </div>
      </div>

      <!-- Weight Configuration -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Priority Weights (%)</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="levelWeight" class="block text-sm font-medium text-gray-700 mb-2">
              Academic Level Weight
            </label>
            <input
              type="number"
              id="levelWeight"
              bind:value={allocationSettings.levelWeight}
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="gpaWeight" class="block text-sm font-medium text-gray-700 mb-2">
              GPA Weight
            </label>
            <input
              type="number"
              id="gpaWeight"
              bind:value={allocationSettings.gpaWeight}
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="distanceWeight" class="block text-sm font-medium text-gray-700 mb-2">
              Distance Weight
            </label>
            <input
              type="number"
              id="distanceWeight"
              bind:value={allocationSettings.distanceWeight}
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="disabilityWeight" class="block text-sm font-medium text-gray-700 mb-2">
              Disability Weight
            </label>
            <input
              type="number"
              id="disabilityWeight"
              bind:value={allocationSettings.disabilityWeight}
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Total: {allocationSettings.levelWeight + allocationSettings.gpaWeight + allocationSettings.distanceWeight + allocationSettings.disabilityWeight}%
        </p>
      </div>

      <!-- Room Configuration -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Room Configuration</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="maxOccupancy" class="block text-sm font-medium text-gray-700 mb-2">
              Maximum Room Occupancy
            </label>
            <input
              type="number"
              id="maxOccupancy"
              bind:value={allocationSettings.maxRoomOccupancy}
              min="1"
              max="8"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex items-center space-y-4">
            <div class="flex items-center">
              <input
                type="checkbox"
                id="autoAllocation"
                bind:checked={allocationSettings.autoAllocation}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="autoAllocation" class="ml-2 block text-sm text-gray-900">
                Enable Automatic Allocation
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Payment Settings Tab -->
{#if activeTab === 'payment'}
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">Payment Configuration</h2>
      <div class="flex space-x-3">
        <button
          on:click={() => openResetModal('payment')}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Reset Fees
        </button>
        <button
          on:click={() => saveSettings('payment')}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Hostel Fees -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Hostel Fees</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="maleHallAFee" class="block text-sm font-medium text-gray-700 mb-2">
              Male Hall A Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="maleHallAFee"
                bind:value={paymentSettings.maleHallAFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="maleHallBFee" class="block text-sm font-medium text-gray-700 mb-2">
              Male Hall B Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="maleHallBFee"
                bind:value={paymentSettings.maleHallBFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="femaleHallAFee" class="block text-sm font-medium text-gray-700 mb-2">
              Female Hall A Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="femaleHallAFee"
                bind:value={paymentSettings.femaleHallAFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="femaleHallBFee" class="block text-sm font-medium text-gray-700 mb-2">
              Female Hall B Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="femaleHallBFee"
                bind:value={paymentSettings.femaleHallBFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Fees -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Additional Fees</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="lateFee" class="block text-sm font-medium text-gray-700 mb-2">
              Late Application Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="lateFee"
                bind:value={paymentSettings.lateFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="processingFee" class="block text-sm font-medium text-gray-700 mb-2">
              Processing Fee
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="number"
                id="processingFee"
                bind:value={paymentSettings.processingFee}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <input
              type="checkbox"
              id="enableOnlinePayment"
              bind:checked={paymentSettings.enableOnlinePayment}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="enableOnlinePayment" class="ml-2 block text-sm text-gray-900">
              Online Card Payment
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="enableBankTransfer"
              bind:checked={paymentSettings.enableBankTransfer}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="enableBankTransfer" class="ml-2 block text-sm text-gray-900">
              Bank Transfer
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="enableUSSD"
              bind:checked={paymentSettings.enableUSSD}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="enableUSSD" class="ml-2 block text-sm text-gray-900">
              USSD Payment
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="enableMobileMoney"
              bind:checked={paymentSettings.enableMobileMoney}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="enableMobileMoney" class="ml-2 block text-sm text-gray-900">
              Mobile Money
            </label>
          </div>
        </div>
      </div>

      <!-- Payment Gateway Configuration -->
      <div>
        <h3 class="text-md font-medium text-gray-900 mb-4">Payment Gateway Integration</h3>
        
        <!-- Paystack -->
        <div class="mb-4 p-4 border border-gray-200 rounded-lg">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-medium text-gray-900">Paystack</h4>
            <button
              on:click={() => testPaymentGateway('paystack')}
              class="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded"
            >
              Test Connection
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="paystackPublicKey" class="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <input
                type="text"
                id="paystackPublicKey"
                bind:value={paymentSettings.paystackPublicKey}
                placeholder="pk_test_..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="paystackSecretKey" class="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                id="paystackSecretKey"
                bind:value={paymentSettings.paystackSecretKey}
                placeholder="sk_test_..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Flutterwave -->
        <div class="p-4 border border-gray-200 rounded-lg">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-medium text-gray-900">Flutterwave</h4>
            <button
              on:click={() => testPaymentGateway('flutterwave')}
              class="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded"
            >
              Test Connection
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="flutterwavePublicKey" class="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <input
                type="text"
                id="flutterwavePublicKey"
                bind:value={paymentSettings.flutterwavePublicKey}
                placeholder="FLWPUBK_TEST-..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="flutterwaveSecretKey" class="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                id="flutterwaveSecretKey"
                bind:value={paymentSettings.flutterwaveSecretKey}
                placeholder="FLWSECK_TEST-..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Email Settings Tab -->
{#if activeTab === 'email'}
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">Email Configuration</h2>
      <div class="flex space-x-3">
        <button
          on:click={testEmailConnection}
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md"
        >
          Test Connection
        </button>
        <button
          on:click={() => saveSettings('email')}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    <div class="space-y-6">
      <div class="flex items-center mb-4">
        <input
          type="checkbox"
          id="enableEmailNotifications"
          bind:checked={emailSettings.enableEmailNotifications}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="enableEmailNotifications" class="ml-2 block text-sm text-gray-900">
          Enable Email Notifications
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="smtpHost" class="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host
          </label>
          <input
            type="text"
            id="smtpHost"
            bind:value={emailSettings.smtpHost}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="smtpPort" class="block text-sm font-medium text-gray-700 mb-2">
            SMTP Port
          </label>
          <input
            type="number"
            id="smtpPort"
            bind:value={emailSettings.smtpPort}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="smtpUsername" class="block text-sm font-medium text-gray-700 mb-2">
            SMTP Username
          </label>
          <input
            type="text"
            id="smtpUsername"
            bind:value={emailSettings.smtpUsername}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="smtpPassword" class="block text-sm font-medium text-gray-700 mb-2">
            SMTP Password
          </label>
          <input
            type="password"
            id="smtpPassword"
            bind:value={emailSettings.smtpPassword}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="fromEmail" class="block text-sm font-medium text-gray-700 mb-2">
            From Email
          </label>
          <input
            type="email"
            id="fromEmail"
            bind:value={emailSettings.fromEmail}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="fromName" class="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            id="fromName"
            bind:value={emailSettings.fromName}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Notifications Settings Tab -->
{#if activeTab === 'notifications'}
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-lg font-medium text-gray-900">Notification Settings</h2>
      <div class="flex space-x-3">
        <button
          on:click={sendTestNotification}
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md"
        >
          Send Test
        </button>
        <button
          on:click={() => saveSettings('notifications')}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-md font-medium text-gray-900">Email Notifications</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center">
          <input
            type="checkbox"
            id="applicationReceived"
            bind:checked={notificationSettings.applicationReceived}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="applicationReceived" class="ml-2 block text-sm text-gray-900">
            Application Received
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="applicationApproved"
            bind:checked={notificationSettings.applicationApproved}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="applicationApproved" class="ml-2 block text-sm text-gray-900">
            Application Approved
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="applicationRejected"
            bind:checked={notificationSettings.applicationRejected}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="applicationRejected" class="ml-2 block text-sm text-gray-900">
            Application Rejected
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="allocationAssigned"
            bind:checked={notificationSettings.allocationAssigned}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="allocationAssigned" class="ml-2 block text-sm text-gray-900">
            Allocation Assigned
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="paymentReceived"
            bind:checked={notificationSettings.paymentReceived}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="paymentReceived" class="ml-2 block text-sm text-gray-900">
            Payment Received
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="paymentConfirmed"
            bind:checked={notificationSettings.paymentConfirmed}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="paymentConfirmed" class="ml-2 block text-sm text-gray-900">
            Payment Confirmed
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="deadlineReminders"
            bind:checked={notificationSettings.deadlineReminders}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="deadlineReminders" class="ml-2 block text-sm text-gray-900">
            Deadline Reminders
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="systemMaintenance"
            bind:checked={notificationSettings.systemMaintenance}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="systemMaintenance" class="ml-2 block text-sm text-gray-900">
            System Maintenance
          </label>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Run Algorithm Confirmation Modal -->
{#if showRunAlgorithmModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeRunAlgorithmModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Run Allocation Algorithm
        </h3>
        <button
          on:click={closeRunAlgorithmModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <p class="text-gray-700 mb-4">
          This will run the allocation algorithm for all pending applications. Continue?
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-yellow-800 mb-2">
            ⚠️ <strong>Important:</strong>
          </p>
          <ul class="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>All pending approved applications will be processed</li>
            <li>Students will be assigned to hostels based on algorithm settings</li>
            <li>This operation may take several minutes</li>
            <li>Notifications will be sent to allocated students</li>
          </ul>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            ℹ️ Make sure allocation settings are configured correctly before proceeding.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeRunAlgorithmModal}
          disabled={runningAlgorithm}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={runAllocationAlgorithm}
          disabled={runningAlgorithm}
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if runningAlgorithm}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running...
          {:else}
            Run Algorithm
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Reset Settings Confirmation Modal -->
{#if showResetModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeResetModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Reset Settings
        </h3>
        <button
          on:click={closeResetModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <p class="text-gray-700 mb-4">
          Reset <strong>{resetCategory}</strong> settings to defaults?
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">
            ⚠️ <strong>Warning:</strong> All current {resetCategory} settings will be replaced with default values. This action cannot be undone.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeResetModal}
          disabled={resettingSettings}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={resetToDefaults}
          disabled={resettingSettings}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if resettingSettings}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Resetting...
          {:else}
            Reset to Defaults
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

