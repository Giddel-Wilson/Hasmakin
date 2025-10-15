<!-- Admin Users Management -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientAuth } from '$lib/auth';
  import { calculateAcademicLevel, getLevelDescription, hasGraduated } from '$lib/academic-levels';

  let users: any[] = [];
  let filteredUsers: any[] = [];
  let loading = true;
  let error = '';
  let success = '';

  // Filters
  let searchQuery = '';
  let roleFilter = 'ALL';
  let statusFilter = 'ALL';
  let levelFilter = 'ALL';

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalPages = 1;

  // Stats
  let stats = {
    totalUsers: 0,
    activeStudents: 0,
    pendingStudents: 0,
    adminUsers: 0,
    newRegistrations: 0
  };

  // Modal state
  let showCreateUserModal = false;
  let showEditUserModal = false;
  let selectedUser: any = null;
  
  // Password reset modal state
  let showResetPasswordModal = false;
  let resetPasswordUserId = '';
  let resettingPassword = false;
  
  // Update admission years modal state
  let showUpdateAdmissionYearsModal = false;
  let updatingAdmissionYears = false;

  // Form data
  let newUser = {
    name: '',
    email: '',
    matricNo: '',
    phone: '',
    role: 'STUDENT',
    level: '100',
    faculty: '',
    department: '',
    status: 'ACTIVE'
  };

  const levels = ['100', '200', '300', '400', '500'];
  const faculties = [
    'Engineering',
    'Sciences',
    'Social Sciences',
    'Arts',
    'Management Sciences',
    'Education',
    'Agriculture',
    'Law',
    'Pharmacy',
    'Medicine'
  ];

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/users');
      if (response.ok) {
        users = await response.json();
      } else {
        console.error('Failed to load users:', response.status);
        error = 'Failed to load users. Please try again.';
        users = [];
      }

      updateStats();
      applyFilters();
    } catch (err) {
      console.error('Failed to load users:', err);
      error = 'Failed to load users. Please check your connection.';
      users = [];
      updateStats();
      applyFilters();
    } finally {
      loading = false;
    }
  }



  function updateStats() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    stats = {
      totalUsers: users.length,
      activeStudents: users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE').length,
      pendingStudents: users.filter(u => u.role === 'STUDENT' && u.status === 'PENDING').length,
      adminUsers: users.filter(u => u.role === 'ADMIN').length,
      newRegistrations: users.filter(u => new Date(u.createdAt) >= oneWeekAgo).length
    };
  }

  function applyFilters() {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.matricNo?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(user => user.level === levelFilter);
    }

    filteredUsers = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages || 1);
  }

  function getPaginatedUsers() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }

  async function createUser() {
    try {
      const response = await ClientAuth.fetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const userData = await response.json();
        const createdUser = userData.user || userData;

        users = [createdUser, ...users];
        updateStats();
        applyFilters();
        showCreateUserModal = false;
        resetNewUserForm();
        success = 'User created successfully';
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Failed to create user';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to create user';
      setTimeout(() => error = '', 3000);
    }
  }

  async function updateUser() {
    if (!selectedUser) return;

    try {
      const response = await ClientAuth.fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(selectedUser)
      });

      if (response.ok) {
        const userData = await response.json();
        users = users.map(user =>
          user.id === selectedUser.id
            ? { ...selectedUser, updatedAt: new Date().toISOString() }
            : user
        );
        updateStats();
        applyFilters();
        showEditUserModal = false;
        selectedUser = null;
        success = 'User updated successfully';
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Failed to update user';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to update user';
      setTimeout(() => error = '', 3000);
    }
  }

  async function toggleUserStatus(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const response = await ClientAuth.fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        users = users.map(u =>
          u.id === userId
            ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
            : u
        );
        updateStats();
        applyFilters();
        success = `User ${newStatus.toLowerCase()} successfully`;
        setTimeout(() => success = '', 3000);
      } else {
        error = 'Failed to update user status';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to update user status';
      setTimeout(() => error = '', 3000);
    }
  }

  function openResetPasswordModal(userId: string) {
    resetPasswordUserId = userId;
    showResetPasswordModal = true;
  }

  function closeResetPasswordModal() {
    showResetPasswordModal = false;
    resetPasswordUserId = '';
  }

  async function resetUserPassword() {
    if (!resetPasswordUserId) return;

    try {
      resettingPassword = true;
      const response = await ClientAuth.fetch(`/api/admin/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        success = 'Password reset email sent successfully';
        setTimeout(() => success = '', 3000);
        closeResetPasswordModal();
      } else {
        error = 'Failed to reset password';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to reset password';
      setTimeout(() => error = '', 3000);
    } finally {
      resettingPassword = false;
    }
  }

  function openUpdateAdmissionYearsModal() {
    showUpdateAdmissionYearsModal = true;
  }

  function closeUpdateAdmissionYearsModal() {
    showUpdateAdmissionYearsModal = false;
  }

  async function updateAllAdmissionYears() {
    try {
      updatingAdmissionYears = true;
      const response = await ClientAuth.fetch('/api/admin/users/update-admission-years', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        success = result.message;
        if (result.errors && result.errors.length > 0) {
          console.warn('Some users could not be updated:', result.errors);
        }
        setTimeout(() => success = '', 5000);
        
        // Reload users to show updated admission years
        await loadUsers();
        closeUpdateAdmissionYearsModal();
      } else {
        error = 'Failed to update admission years';
        setTimeout(() => error = '', 3000);
      }
    } catch (err) {
      error = 'Failed to update admission years';
      setTimeout(() => error = '', 3000);
    } finally {
      updatingAdmissionYears = false;
    }
  }

  // Helper function to get current academic level for a user
  function getCurrentLevel(user: any): string {
    if (!user.admissionYear) return 'Unknown';
    
    if (hasGraduated(user.admissionYear)) {
      return 'Graduated';
    }
    
    const level = calculateAcademicLevel(user.admissionYear);
    return getLevelDescription(level);
  }

  function openEditModal(user: any) {
    selectedUser = { ...user };
    showEditUserModal = true;
  }

  function resetNewUserForm() {
    newUser = {
      name: '',
      email: '',
      matricNo: '',
      phone: '',
      role: 'STUDENT',
      level: '100',
      faculty: '',
      department: '',
      status: 'ACTIVE'
    };
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STUDENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function exportUsers() {
    const csvContent = [
      ['Name', 'Email', 'Matric No', 'Phone', 'Role', 'Level', 'Faculty', 'Status', 'Email Verified', 'Last Login', 'Created'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.matricNo || 'N/A',
        user.phone,
        user.role,
        user.level || 'N/A',
        user.faculty || 'N/A',
        user.status,
        user.emailVerified ? 'Yes' : 'No',
        user.lastLogin ? formatDate(user.lastLogin) : 'Never',
        formatDate(user.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Reactive filters
  $: searchQuery, roleFilter, statusFilter, levelFilter, applyFilters();
</script>

<svelte:head>
  <title>Users Management - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Users Management</h1>
    <p class="text-gray-600">Manage student and admin accounts</p>
  </div>
  <div class="flex space-x-3">
    <button
      on:click={() => showCreateUserModal = true}
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
    >
      Add User
    </button>
    <button
      on:click={openUpdateAdmissionYearsModal}
      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
      disabled={loading}
    >
      Update Admission Years
    </button>
    <button
      on:click={exportUsers}
      class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
    >
      Export CSV
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
    <div class="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
    <div class="text-sm text-gray-600">Total Users</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
    <div class="text-sm text-gray-600">Active Students</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-yellow-600">{stats.pendingStudents}</div>
    <div class="text-sm text-gray-600">Pending</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-purple-600">{stats.adminUsers}</div>
    <div class="text-sm text-gray-600">Admins</div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow border">
    <div class="text-2xl font-bold text-blue-600">{stats.newRegistrations}</div>
    <div class="text-sm text-gray-600">New (7 days)</div>
  </div>
</div>

<!-- Filters -->
<div class="bg-white p-6 rounded-lg shadow mb-6">
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <!-- Search -->
    <div class="md:col-span-2">
      <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
      <input
        type="text"
        id="search"
        bind:value={searchQuery}
        placeholder="Name, email, matric no..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Role Filter -->
    <div>
      <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
      <select
        id="role"
        bind:value={roleFilter}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All Roles</option>
        <option value="STUDENT">Students</option>
        <option value="ADMIN">Admins</option>
      </select>
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
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="PENDING">Pending</option>
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
        {#each levels as level}
          <option value={level}>{level} Level</option>
        {/each}
      </select>
    </div>
  </div>
</div>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <!-- Users Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Academic Info
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Application
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each getPaginatedUsers() as user}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span class="text-sm font-medium text-gray-700">
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{user.name}</div>
                    <div class="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm text-gray-900">{user.phone}</div>
                  <div class="flex space-x-1 mt-1">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {user.emailVerified ? '✓ Email' : '✗ Email'}
                    </span>
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {user.phoneVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {user.phoneVerified ? '✓ Phone' : '✗ Phone'}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {getRoleBadgeClass(user.role)}">
                    {user.role}
                  </span>
                  {#if user.role === 'STUDENT'}
                    <div class="text-sm text-gray-900 mt-1">{user.matricNo}</div>
                    <div class="text-sm text-gray-600">Current: {getCurrentLevel(user)}</div>
                    {#if user.admissionYear}
                      <div class="text-xs text-gray-500">Admitted: {user.admissionYear}</div>
                    {:else}
                      <div class="text-xs text-red-500">No admission year</div>
                    {/if}
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {getStatusBadgeClass(user.status)}">
                  {user.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {#if user.applications && user.applications.length > 0}
                  <div class="text-sm text-gray-900">Applied</div>
                  <div class="text-xs text-gray-500">{user.applications[0].status}</div>
                {:else if user.allocations && user.allocations.length > 0}
                  <div class="text-sm text-green-600">Allocated</div>
                  <div class="text-xs text-gray-500">{user.allocations[0].hostel.name}</div>
                {:else if user.role === 'STUDENT'}
                  <div class="text-sm text-gray-400">No application</div>
                {:else}
                  <div class="text-sm text-gray-400">N/A</div>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    on:click={() => openEditModal(user)}
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => toggleUserStatus(user.id)}
                    class="text-{user.status === 'ACTIVE' ? 'red' : 'green'}-600 hover:text-{user.status === 'ACTIVE' ? 'red' : 'green'}-900"
                  >
                    {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    on:click={() => openResetPasswordModal(user.id)}
                    class="text-purple-600 hover:text-purple-900"
                  >
                    Reset Password
                  </button>
                </div>
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
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

<!-- Create User Modal -->
{#if showCreateUserModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
        
        <form on:submit|preventDefault={createUser} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                bind:value={newUser.name}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                bind:value={newUser.email}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                id="phone"
                bind:value={newUser.phone}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="role"
                bind:value={newUser.role}
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STUDENT">Student</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          
          {#if newUser.role === 'STUDENT'}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="matricNo" class="block text-sm font-medium text-gray-700">Matric Number</label>
                <input
                  type="text"
                  id="matricNo"
                  bind:value={newUser.matricNo}
                  placeholder="U2024/5570001"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="level" class="block text-sm font-medium text-gray-700">Level</label>
                <select
                  id="level"
                  bind:value={newUser.level}
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {#each levels as level}
                    <option value={level}>{level}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label for="faculty" class="block text-sm font-medium text-gray-700">Faculty</label>
                <select
                  id="faculty"
                  bind:value={newUser.faculty}
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {#each faculties as faculty}
                    <option value={faculty}>{faculty}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div>
              <label for="department" class="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="department"
                bind:value={newUser.department}
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {/if}
          
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={() => { showCreateUserModal = false; resetNewUserForm(); }}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit User Modal -->
{#if showEditUserModal && selectedUser}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
        
        <form on:submit|preventDefault={updateUser} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="editName" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="editName"
                bind:value={selectedUser.name}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="editEmail" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="editEmail"
                bind:value={selectedUser.email}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="editPhone" class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                id="editPhone"
                bind:value={selectedUser.phone}
                required
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="editStatus" class="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="editStatus"
                bind:value={selectedUser.status}
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
          
          {#if selectedUser.role === 'STUDENT'}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="editMatricNo" class="block text-sm font-medium text-gray-700">Matric Number</label>
                <input
                  type="text"
                  id="editMatricNo"
                  bind:value={selectedUser.matricNo}
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="editLevel" class="block text-sm font-medium text-gray-700">Level</label>
                <select
                  id="editLevel"
                  bind:value={selectedUser.level}
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {#each levels as level}
                    <option value={level}>{level}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label for="editFaculty" class="block text-sm font-medium text-gray-700">Faculty</label>
                <select
                  id="editFaculty"
                  bind:value={selectedUser.faculty}
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {#each faculties as faculty}
                    <option value={faculty}>{faculty}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div>
              <label for="editDepartment" class="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="editDepartment"
                bind:value={selectedUser.department}
                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {/if}
          
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={() => { showEditUserModal = false; selectedUser = null; }}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Reset Password Confirmation Modal -->
{#if showResetPasswordModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeResetPasswordModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Reset User Password
        </h3>
        <button
          on:click={closeResetPasswordModal}
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
          Are you sure you want to reset this user's password?
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            ℹ️ The user will receive an email with a new temporary password. They should change it after logging in.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeResetPasswordModal}
          disabled={resettingPassword}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={resetUserPassword}
          disabled={resettingPassword}
          class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if resettingPassword}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Resetting...
          {:else}
            Reset Password
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Update Admission Years Confirmation Modal -->
{#if showUpdateAdmissionYearsModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeUpdateAdmissionYearsModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Update All Admission Years
        </h3>
        <button
          on:click={closeUpdateAdmissionYearsModal}
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
          This will update admission years for all users based on their matriculation numbers. Continue?
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-yellow-800 mb-2">
            ⚠️ <strong>This is a bulk operation:</strong>
          </p>
          <ul class="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>All student admission years will be recalculated</li>
            <li>Based on matriculation number format</li>
            <li>May take a few moments to complete</li>
          </ul>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            ℹ️ This is useful when matriculation numbers have been corrected or when onboarding historical data.
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeUpdateAdmissionYearsModal}
          disabled={updatingAdmissionYears}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={updateAllAdmissionYears}
          disabled={updatingAdmissionYears}
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if updatingAdmissionYears}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          {:else}
            Update All Years
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

