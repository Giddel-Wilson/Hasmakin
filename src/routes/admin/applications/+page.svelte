<!-- Admin Applications Management -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';

  let applications: any[] = [];
  let filteredApplications: any[] = [];
  let loading = true;
  let error = '';
  let success = '';

  // Filters
  let searchQuery = '';
  let statusFilter = 'ALL';
  let levelFilter = 'ALL';
  let hostelFilter = 'ALL';
  let dateFilter = '';

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalPages = 1;

  // Stats
  let stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  onMount(async () => {
    await loadApplications();
  });

  async function loadApplications() {
    try {
      loading = true;
      error = '';

      console.log('[Admin Applications] Fetching applications...');
      const response = await ClientAuth.fetch('/api/admin/applications');
      console.log('[Admin Applications] Response status:', response.status);
      
      if (response.ok) {
        applications = await response.json();
        console.log('[Admin Applications] Received applications:', applications.length);
        if (applications.length > 0) {
          console.log('[Admin Applications] First application:', applications[0]);
        }
        
        updateStats();
        applyFilters();
      } else {
        const errorText = await response.text();
        console.error('[Admin Applications] Failed to load:', response.status, errorText);
        error = 'Failed to load applications. Please try again.';
        applications = [];
        updateStats();
        applyFilters();
      }
    } catch (err) {
      console.error('[Admin Applications] Error:', err);
      error = 'Failed to load applications. Please check your connection.';
      applications = [];
      updateStats();
      applyFilters();
    } finally {
      loading = false;
    }
  }



  function updateStats() {
    stats = {
      total: applications.length,
      pending: applications.filter(app => app.applicationStatus === 'PENDING').length,
      approved: applications.filter(app => app.applicationStatus === 'APPROVED').length,
      rejected: applications.filter(app => app.applicationStatus === 'REJECTED').length
    };
  }

  function applyFilters() {
    console.log('[Admin Applications] applyFilters called');
    console.log('[Admin Applications] applications.length:', applications.length);
    console.log('[Admin Applications] statusFilter:', statusFilter);
    console.log('[Admin Applications] searchQuery:', searchQuery);
    
    filteredApplications = applications.filter(app => {
      // Status filter - check for 'ALL' or 'all' to show all statuses
      if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'all' && app.applicationStatus !== statusFilter) {
        console.log('[Admin Applications] Filtered out by status:', app.id, 'has', app.applicationStatus, 'but filter is', statusFilter);
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          app.user?.firstName,
          app.user?.lastName,
          app.user?.matricNumber,
          app.user?.email
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          console.log('[Admin Applications] Filtered out by search:', app.id);
          return false;
        }
      }
      
      return true;
    });
    
    console.log('[Admin Applications] filteredApplications.length after filtering:', filteredApplications.length);
    if (filteredApplications.length > 0) {
      console.log('[Admin Applications] First filtered item:', {
        id: filteredApplications[0].id,
        status: filteredApplications[0].applicationStatus,
        user: filteredApplications[0].user
      });
    }
    updateStats();
  }

  function getPaginatedApplications() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    console.log('[Admin Applications] getPaginatedApplications called');
    console.log('[Admin Applications] filteredApplications.length:', filteredApplications.length);
    console.log('[Admin Applications] currentPage:', currentPage, 'itemsPerPage:', itemsPerPage);
    console.log('[Admin Applications] start:', start, 'end:', end);
    const paginated = filteredApplications.slice(start, end);
    console.log('[Admin Applications] paginated.length:', paginated.length);
    if (paginated.length > 0) {
      console.log('[Admin Applications] First paginated item:', JSON.stringify(paginated[0], null, 2));
    }
    return paginated;
  }

  async function updateApplicationStatus(applicationId: string, newStatus: string) {
    try {
      const response = await ClientAuth.fetch(`/api/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        applications = applications.map(app =>
          app.id === applicationId
            ? { ...app, applicationStatus: newStatus, updatedAt: new Date().toISOString() }
            : app
        );
        updateStats();
        applyFilters();
        success = `Application ${newStatus.toLowerCase()} successfully`;
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Failed to update application status';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to update application status';
      setTimeout(() => error = '', 3000);
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function exportApplications() {
    const csvContent = [
      ['Name', 'Matric No', 'Email', 'Level', 'Status', 'Preferences', 'Special Needs', 'Medical Conditions', 'Roommate Request', 'Submitted', 'Reviewed'].join(','),
      ...filteredApplications.map(app => [
        app.user.name,
        app.user.matricNo,
        app.user.email,
        app.academicLevel,
        app.applicationStatus,
        app.hostelPreferences.join('; '),
        app.specialNeeds || 'None',
        app.medicalConditions || 'None',
        app.requestedRoommate ? `${app.requestedRoommate.name} (${app.requestedRoommate.matricNo})` : (app.requestedRoommateId ? 'Yes' : 'No'),
        formatDate(app.submittedAt),
        app.reviewedAt ? formatDate(app.reviewedAt) : 'Not reviewed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Reactive filters
  $: searchQuery, statusFilter, levelFilter, hostelFilter, dateFilter, applyFilters();
</script>

<svelte:head>
  <title>Applications Management - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8">
  <h1 class="text-2xl font-bold text-gray-900">Applications Management</h1>
  <p class="text-gray-600">Review and manage student accommodation applications</p>
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
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-gray-900">{stats.total}</div>
    <div class="text-sm text-gray-600">Total Applications</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-yellow-600">{stats.pending}</div>
    <div class="text-sm text-gray-600">Pending Review</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-green-600">{stats.approved}</div>
    <div class="text-sm text-gray-600">Approved</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-red-600">{stats.rejected}</div>
    <div class="text-sm text-gray-600">Rejected</div>
  </div>
</div>

<!-- Filters -->
<div class="bg-white p-6 rounded-lg shadow mb-6">
  <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
    <!-- Search -->
    <div class="md:col-span-2">
      <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
      <input
        type="text"
        id="search"
        bind:value={searchQuery}
        placeholder="Name, matric no, or email..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Status Filter -->
    <div>
      <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        id="status"
        bind:value={statusFilter}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>

    <!-- Level Filter -->
    <div>
      <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Level</label>
      <select
        id="level"
        bind:value={levelFilter}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All Levels</option>
        <option value="YEAR_1">Year 1</option>
        <option value="YEAR_2">Year 2</option>
        <option value="YEAR_3">Year 3</option>
        <option value="YEAR_4">Year 4</option>
        <option value="YEAR_5">Year 5</option>
      </select>
    </div>

    <!-- Hostel Filter -->
    <div>
      <label for="hostel" class="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
      <select
        id="hostel"
        bind:value={hostelFilter}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All Hostels</option>
        <option value="Male Hall A">Male Hall A</option>
        <option value="Male Hall B">Male Hall B</option>
        <option value="Female Hall A">Female Hall A</option>
        <option value="Female Hall B">Female Hall B</option>
      </select>
    </div>

    <!-- Export Button -->
    <div class="flex items-end">
      <button
        on:click={exportApplications}
        class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Export CSV
      </button>
    </div>
  </div>
</div>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <!-- Applications Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
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
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each getPaginatedApplications() as application}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{application.user.name}</div>
                  <div class="text-sm text-gray-500">{application.user.matricNo}</div>
                  <div class="text-sm text-gray-500">{application.user.email}</div>
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
                  {#if application.hostelPreferences.length > 2}
                    <div class="text-xs text-gray-400">+{application.hostelPreferences.length - 2} more</div>
                  {/if}
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
                    <div class="text-xs text-gray-600 ml-1 max-w-xs truncate" title={application.specialNeeds}>
                      {application.specialNeeds}
                    </div>
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
                    <div class="text-xs text-gray-600 ml-1 max-w-xs truncate" title={application.medicalConditions}>
                      {application.medicalConditions}
                    </div>
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
                        {application.requestedRoommate.name}
                        <span class="text-gray-400">({application.requestedRoommate.matricNo})</span>
                      </div>
                    {:else}
                      <div class="text-xs text-gray-600 ml-1">
                        Requested
                      </div>
                    {/if}
                  {/if}
                  {#if !application.specialNeeds && !application.medicalConditions && !application.requestedRoommateId}
                    <span class="text-gray-400 italic">None</span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {getStatusBadgeClass(application.applicationStatus)}">
                  {application.applicationStatus}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(application.submittedAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {#if application.applicationStatus === 'PENDING'}
                  <div class="flex space-x-2">
                    <button
                      on:click={() => updateApplicationStatus(application.id, 'APPROVED')}
                      class="text-green-600 hover:text-green-900 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      on:click={() => updateApplicationStatus(application.id, 'REJECTED')}
                      class="text-red-600 hover:text-red-900 font-medium"
                    >
                      Reject
                    </button>
                  </div>
                {:else}
                  <button
                    on:click={() => updateApplicationStatus(application.id, 'PENDING')}
                    class="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Reset
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between items-center">
          <div class="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length} results
          </div>
          <div class="flex space-x-2">
            <button
              on:click={() => currentPage = Math.max(1, currentPage - 1)}
              disabled={currentPage === 1}
              class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
              disabled={currentPage === totalPages}
              class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
