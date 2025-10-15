<!-- Admin Allocations Management -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';

  let allocations: any[] = [];
  let pendingApplications: any[] = [];
  let hostels: any[] = [];
  let loading = true;
  let error = '';
  let success = '';
  let allocationInProgress = false;
  let showAllocationModal = false;
  
  // Deallocate modal state
  let showDeallocateModal = false;
  let deallocateAllocationId = '';
  let deallocating = false;

  // Allocation settings
  let allocationSettings = {
    prioritizeByLevel: true,
    prioritizeBySubmissionDate: true,
    allowPartialAllocation: true,
    considerSpecialNeeds: true,
    maxAllocationsPerRun: 100
  };

  // Stats
  let stats = {
    totalApplications: 0,
    pendingApplications: 0,
    allocatedApplications: 0,
    availableBeds: 0,
    allocationRate: 0
  };

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = '';

      // Load allocations, pending applications, and hostels in parallel
      const [allocationsResponse, applicationsResponse, hostelsResponse] = await Promise.all([
        ClientAuth.fetch('/api/admin/allocations'),
        ClientAuth.fetch('/api/admin/applications?status=APPROVED'),
        ClientAuth.fetch('/api/admin/hostels')
      ]);

      if (allocationsResponse.ok) {
        const allocationData = await allocationsResponse.json();
        allocations = allocationData.allocations || allocationData;
        // Ensure it's an array
        if (!Array.isArray(allocations)) {
          allocations = [];
        }
      } else {
        throw new Error('Failed to load allocations');
      }

      if (applicationsResponse.ok) {
        pendingApplications = await applicationsResponse.json();
        // Ensure it's an array
        if (!Array.isArray(pendingApplications)) {
          pendingApplications = [];
        }
      } else {
        throw new Error('Failed to load applications');
      }

      if (hostelsResponse.ok) {
        const hostelData = await hostelsResponse.json();
        hostels = hostelData.hostels || hostelData;
        // Ensure it's an array
        if (!Array.isArray(hostels)) {
          hostels = [];
        }
      } else {
        throw new Error('Failed to load hostels');
      }

      updateStats();
    } catch (err) {
      console.error('Failed to load data:', err);
      error = 'Failed to load allocation data';
    } finally {
      loading = false;
    }
  }



  function updateStats() {
    const totalApplications = allocations.length + pendingApplications.length;
    const allocatedApplications = allocations.length;
    const availableBeds = hostels.reduce((sum, hostel) => {
      const available = (hostel.totalCapacity || 0) - (hostel.totalOccupied || 0);
      return sum + available;
    }, 0);
    
    stats = {
      totalApplications,
      pendingApplications: pendingApplications.length,
      allocatedApplications,
      availableBeds,
      allocationRate: totalApplications > 0 ? Math.round((allocatedApplications / totalApplications) * 100) : 0
    };
  }

  function openAllocationModal() {
    showAllocationModal = true;
  }

  function closeAllocationModal() {
    showAllocationModal = false;
  }

  async function runAllocation() {
    if (pendingApplications.length === 0) {
      error = 'No pending applications to allocate';
      setTimeout(() => error = '', 3000);
      return;
    }

    if (stats.availableBeds === 0) {
      error = 'No available beds for allocation';
      setTimeout(() => error = '', 3000);
      return;
    }

    try {
      allocationInProgress = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/allocations/run', {
        method: 'POST',
        body: JSON.stringify({
          settings: allocationSettings,
          applicationIds: pendingApplications.slice(0, allocationSettings.maxAllocationsPerRun).map(app => app.id)
        })
      });

      if (response.ok) {
        const result = await response.json();
        success = `Successfully allocated ${result.allocatedCount} students to hostels`;
        await loadData(); // Reload data
      } else {
        error = 'Failed to run allocation process';
        setTimeout(() => error = '', 3000);
        return;
      }

      closeAllocationModal();
      setTimeout(() => success = '', 5000);
    } catch (err) {
      error = 'Failed to run allocation process';
      setTimeout(() => error = '', 3000);
    } finally {
      allocationInProgress = false;
    }
  }



  function openDeallocateModal(allocationId: string) {
    deallocateAllocationId = allocationId;
    showDeallocateModal = true;
  }

  function closeDeallocateModal() {
    showDeallocateModal = false;
    deallocateAllocationId = '';
  }

  async function deallocateStudent() {
    if (!deallocateAllocationId) return;

    try {
      deallocating = true;
      const response = await ClientAuth.fetch(`/api/admin/allocations/${deallocateAllocationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from allocations and add back to pending
        const allocation = allocations.find(a => a.id === deallocateAllocationId);
        if (allocation) {
          allocations = allocations.filter(a => a.id !== deallocateAllocationId);
          
          // Add back to pending applications
          const pendingApp = {
            id: `app-${allocation.user.matricNo.slice(-7)}`,
            user: allocation.user,
            academicLevel: allocation.application?.level || 'YEAR_1',
            hostelPreferences: [allocation.room?.hostel?.name || 'N/A'],
            submittedAt: new Date().toISOString(),
            priority: 5
          };
          
          pendingApplications = [...pendingApplications, pendingApp];
          updateStats();
          success = 'Student deallocated successfully';
          setTimeout(() => success = '', 3000);
        }
        closeDeallocateModal();
      } else {
        error = 'Failed to deallocate student';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to deallocate student';
      setTimeout(() => error = '', 3000);
    } finally {
      deallocating = false;
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'ALLOCATED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CHECKED_IN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getPaymentStatusBadgeClass(status: string) {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function exportAllocations() {
    const csvContent = [
      ['Name', 'Matric No', 'Level', 'Hostel', 'Room', 'Status', 'Allocation Date'].join(','),
      ...allocations.map(alloc => [
        alloc.user?.name || 'N/A',
        alloc.user?.matricNo || 'N/A',
        alloc.application?.level || 'N/A',
        alloc.room?.hostel?.name || 'N/A',
        alloc.room?.number || 'N/A',
        alloc.status || 'N/A',
        alloc.allocatedAt ? formatDate(alloc.allocatedAt) : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allocations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Allocations Management - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Allocations Management</h1>
    <p class="text-gray-600">Run allocation algorithms and manage hostel assignments</p>
  </div>
  <div class="flex space-x-3">
    <button
      on:click={exportAllocations}
      class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
    >
      Export CSV
    </button>
    <button
      on:click={openAllocationModal}
      disabled={pendingApplications.length === 0 || stats.availableBeds === 0}
      class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center"
    >
      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      Run Allocation
    </button>
  </div>
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

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
    <div class="text-sm text-gray-600">Total Applications</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</div>
    <div class="text-sm text-gray-600">Pending Allocation</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-green-600">{stats.allocatedApplications}</div>
    <div class="text-sm text-gray-600">Allocated</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-blue-600">{stats.availableBeds}</div>
    <div class="text-sm text-gray-600">Available Beds</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-purple-600">{stats.allocationRate}%</div>
    <div class="text-sm text-gray-600">Allocation Rate</div>
  </div>
</div>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Current Allocations -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Current Allocations</h3>
      </div>
      <div class="overflow-hidden">
        <div class="max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hostel/Room
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each allocations.slice(0, 20) as allocation}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{allocation.user.name}</div>
                      <div class="text-sm text-gray-500">{allocation.user.matricNo}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{allocation.room?.hostel?.name || 'N/A'}</div>
                    <div class="text-sm text-gray-500">Room {allocation.room?.number || 'N/A'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(allocation.status)}">
                      {allocation.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      on:click={() => openDeallocateModal(allocation.id)}
                      class="text-red-600 hover:text-red-900 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pending Applications -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Pending Applications</h3>
      </div>
      <div class="overflow-hidden">
        <div class="max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preferences
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Info
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each pendingApplications as application}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{application.user.name}</div>
                      <div class="text-sm text-gray-500">{application.user.matricNo}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.academicLevel.replace('YEAR_', 'Year ')}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                      {#each application.hostelPreferences.slice(0, 2) as pref, i}
                        <div class="text-xs text-gray-600">{i + 1}. {pref}</div>
                      {/each}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-xs space-y-1">
                      {#if application.specialNeeds}
                        <div class="flex items-start">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"/>
                            </svg>
                            Special Needs
                          </span>
                        </div>
                        <div class="text-xs text-gray-600 ml-1">{application.specialNeeds}</div>
                      {/if}
                      {#if application.medicalConditions}
                        <div class="flex items-start">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd"/>
                            </svg>
                            Medical
                          </span>
                        </div>
                        <div class="text-xs text-gray-600 ml-1">{application.medicalConditions}</div>
                      {/if}
                      {#if application.requestedRoommateId}
                        <div class="flex items-start">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                            </svg>
                            Roommate
                          </span>
                        </div>
                        {#if application.requestedRoommate}
                          <div class="text-xs text-gray-600 ml-1">
                            {application.requestedRoommate.name} ({application.requestedRoommate.matricNo})
                          </div>
                        {/if}
                      {/if}
                      {#if !application.specialNeeds && !application.medicalConditions && !application.requestedRoommateId}
                        <div class="text-xs text-gray-400 italic">None</div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.submittedAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Allocation Modal -->
{#if showAllocationModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeAllocationModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" on:click|stopPropagation>
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Run Allocation Process</h3>
        
        <!-- Allocation Settings -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label for="prioritizeByLevel" class="text-sm font-medium text-gray-700">Prioritize by Academic Level</label>
            <input
              id="prioritizeByLevel"
              type="checkbox"
              bind:checked={allocationSettings.prioritizeByLevel}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label for="prioritizeBySubmissionDate" class="text-sm font-medium text-gray-700">Prioritize by Submission Date</label>
            <input
              id="prioritizeBySubmissionDate"
              type="checkbox"
              bind:checked={allocationSettings.prioritizeBySubmissionDate}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label for="considerSpecialNeeds" class="text-sm font-medium text-gray-700">Consider Special Needs</label>
            <input
              id="considerSpecialNeeds"
              type="checkbox"
              bind:checked={allocationSettings.considerSpecialNeeds}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label for="maxAllocationsPerRun" class="block text-sm font-medium text-gray-700 mb-1">
              Max Allocations Per Run
            </label>
            <input
              id="maxAllocationsPerRun"
              type="number"
              bind:value={allocationSettings.maxAllocationsPerRun}
              min="1"
              max="500"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-600">
            <div>Pending Applications: <span class="font-medium">{stats.pendingApplications}</span></div>
            <div>Available Beds: <span class="font-medium">{stats.availableBeds}</span></div>
            <div>Will Allocate: <span class="font-medium">{Math.min(stats.pendingApplications, stats.availableBeds, allocationSettings.maxAllocationsPerRun)}</span> students</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            on:click={closeAllocationModal}
            disabled={allocationInProgress}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            on:click={runAllocation}
            disabled={allocationInProgress || stats.pendingApplications === 0 || stats.availableBeds === 0}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {#if allocationInProgress}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              Start Allocation
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Deallocate Confirmation Modal -->
{#if showDeallocateModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeDeallocateModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Remove Allocation
        </h3>
        <button
          on:click={closeDeallocateModal}
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
          Are you sure you want to remove this allocation?
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            ⚠️ This action will remove the student's hostel allocation and return their application to pending status. The bed space will become available for other students.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeDeallocateModal}
          disabled={deallocating}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={deallocateStudent}
          disabled={deallocating}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if deallocating}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Removing...
          {:else}
            Remove Allocation
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

