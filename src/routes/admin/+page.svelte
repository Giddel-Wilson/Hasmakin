<!-- Admin Dashboard Overview -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';

  let stats = {
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalPayments: 0,
    pendingPayments: 0
  };

  let recentApplications: any[] = [];
  let loading = true;

  onMount(() => {
    loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      loading = true;
      
      // Load dashboard statistics
      const statsResponse = await ClientAuth.fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        stats = {
          totalApplications: statsData.totalApplications || 0,
          pendingApplications: statsData.pendingApplications || 0,
          approvedApplications: statsData.approvedApplications || 0,
          totalBeds: statsData.totalBeds || 0,
          availableBeds: statsData.availableBeds || 0,
          occupiedBeds: statsData.occupiedBeds || 0,
          totalPayments: statsData.totalPayments || 0,
          pendingPayments: statsData.pendingPayments || 0
        };
        console.log('[Dashboard] Loaded stats:', stats);
      } else {
        console.error('Failed to load dashboard stats:', statsResponse.status);
        const errorText = await statsResponse.text();
        console.error('Error details:', errorText);
      }

      // Load recent applications
      const applicationsResponse = await ClientAuth.fetch('/api/admin/applications/recent');
      if (applicationsResponse.ok) {
        recentApplications = await applicationsResponse.json();
        console.log('[Dashboard] Loaded recent applications:', recentApplications.length);
      } else {
        console.error('Failed to load recent applications:', applicationsResponse.status);
        recentApplications = [];
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      recentApplications = [];
    } finally {
      loading = false;
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
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
</script>

<svelte:head>
  <title>Admin Dashboard - UNIPORT HAS</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <!-- Dashboard Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
    <p class="text-gray-600">Monitor hostel allocation system performance and activities</p>
  </div>

  <!-- Statistics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Applications Stats -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
              <dd class="text-lg font-medium text-gray-900">{stats.totalApplications.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-5 py-3">
        <div class="text-sm">
          <span class="text-yellow-600 font-medium">{stats.pendingApplications}</span>
          <span class="text-gray-500"> pending review</span>
        </div>
      </div>
    </div>

    <!-- Bed Availability -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Available Beds</dt>
              <dd class="text-lg font-medium text-gray-900">{stats.availableBeds.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-5 py-3">
        <div class="text-sm">
          <span class="text-gray-500">of {stats.totalBeds.toLocaleString()} total beds</span>
        </div>
      </div>
    </div>

    <!-- Occupancy Rate -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Occupancy Rate</dt>
              <dd class="text-lg font-medium text-gray-900">
                {stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-5 py-3">
        <div class="text-sm">
          <span class="text-green-600 font-medium">{stats.occupiedBeds.toLocaleString()}</span>
          <span class="text-gray-500"> beds occupied</span>
        </div>
      </div>
    </div>

    <!-- Payment Status -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Payment Status</dt>
              <dd class="text-lg font-medium text-gray-900">{stats.totalPayments.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-5 py-3">
        <div class="text-sm">
          <span class="text-red-600 font-medium">{stats.pendingPayments}</span>
          <span class="text-gray-500"> pending payments</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Applications -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Applications</h3>
        <a 
          href="/admin/applications" 
          class="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          View all →
        </a>
      </div>
      
      {#if recentApplications.length > 0}
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matric No
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each recentApplications as application}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {application.studentName}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.matricNo}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.academicLevel}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusBadgeClass(application.status)}">
                      {application.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">No recent applications</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Allocation Actions -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="ml-5">
            <h3 class="text-lg font-medium text-gray-900">Run Allocation</h3>
            <p class="text-sm text-gray-500">Process pending applications</p>
          </div>
        </div>
        <div class="mt-6">
          <a 
            href="/admin/allocations" 
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center"
          >
            Start Allocation Process
          </a>
        </div>
      </div>
    </div>

    <!-- Hostel Management -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div class="ml-5">
            <h3 class="text-lg font-medium text-gray-900">Manage Hostels</h3>
            <p class="text-sm text-gray-500">Add or edit hostel information</p>
          </div>
        </div>
        <div class="mt-6">
          <a 
            href="/admin/hostels" 
            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center"
          >
            Manage Hostels
          </a>
        </div>
      </div>
    </div>

    <!-- System Settings -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-5">
            <h3 class="text-lg font-medium text-gray-900">System Settings</h3>
            <p class="text-sm text-gray-500">Configure allocation parameters</p>
          </div>
        </div>
        <div class="mt-6">
          <a 
            href="/admin/settings" 
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center"
          >
            Open Settings
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}
