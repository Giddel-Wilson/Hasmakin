<!-- Admin Hostels Management -->
<!-- University of Port Harcourt - Hostel Allocation System -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ClientAuth } from '$lib/auth';

  let hostels: any[] = [];
  let loading = true;
  let error = '';
  let success = '';
  let showAddModal = false;
  let editingHostel: any = null;
  
  // Delete hostel modal state
  let showDeleteModal = false;
  let deleteHostelId = '';
  let deleting = false;

  // Multi-step form state
  let currentStep = 1;
  let showPreview = false;
  const totalSteps = 4;

  // New hostel form
  let newHostel = {
    name: '',
    gender: 'MALE',
    totalBeds: 100,
    availableBeds: 100,
    location: '',
    locationDescription: '',
    amenities: [],
    description: '',
    isActive: true
  };

  // Current form data (reactive to handle both new and editing states)
  let currentHostel = { ...newHostel };

  // Update currentHostel when editingHostel changes
  $: if (editingHostel) {
    currentHostel = { ...editingHostel };
  } else {
    currentHostel = { ...newHostel };
  }

  let amenityInput = '';

  const availableAmenities = [
    'Wi-Fi', 'AC', 'Study Room', 'Laundry', 'Kitchen', 'Generator', 
    'Security', 'Parking', 'Recreation Room', 'Medical Center'
  ];

  onMount(async () => {
    await loadHostels();
  });

  async function loadHostels() {
    try {
      loading = true;
      error = '';

      const response = await ClientAuth.fetch('/api/admin/hostels');
      if (response.ok) {
        const data = await response.json();
        const rawHostels = data.hostels || data;
        
        // Map API response to UI format
        hostels = rawHostels.map((hostel: any) => ({
          ...hostel,
          totalBeds: hostel.totalCapacity ?? hostel.capacity ?? 0,
          occupiedBeds: hostel.totalOccupied ?? 0,
          // Use the actual 'available' field from database, not calculated
          availableBeds: hostel.available ?? 0
        }));
        
        console.log('Loaded hostels from admin API:', hostels.length);
        console.log('Sample hostel data:', hostels[0]);
      } else {
        console.error('Failed to load hostels:', response.status);
        error = 'Failed to load hostels. Please try again.';
        hostels = [];
      }
    } catch (err) {
      console.error('Failed to load hostels:', err);
      error = 'Failed to load hostels. Please check your connection.';
      hostels = [];
    } finally {
      loading = false;
    }
  }



  function openAddModal() {
    newHostel = {
      name: '',
      gender: 'MALE',
      totalBeds: 100,
      availableBeds: 100,
      location: '',
      locationDescription: '',
      amenities: [],
      description: '',
      isActive: true
    };
    currentStep = 1;
    showPreview = false;
    showAddModal = true;
  }

  function openEditModal(hostel: any) {
    editingHostel = { 
      ...hostel,
      // Normalize field names for the form
      // Use ?? (nullish coalescing) instead of || to allow 0 values
      totalBeds: hostel.capacity ?? hostel.totalBeds,
      availableBeds: hostel.available ?? hostel.availableBeds
    };
    // Force update currentHostel immediately
    currentHostel = { ...editingHostel };
    currentStep = 1;
    showPreview = false;
    showAddModal = true;
  }

  function closeModal() {
    showAddModal = false;
    editingHostel = null;
    currentStep = 1;
    showPreview = false;
    newHostel = {
      name: '',
      gender: 'MALE',
      totalBeds: 100,
      availableBeds: 100,
      location: '',
      locationDescription: '',
      amenities: [],
      description: '',
      isActive: true
    };
  }

  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep++;
    }
  }

  function previousStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  function goToPreview() {
    showPreview = true;
  }

  function goBackFromPreview() {
    showPreview = false;
  }

  // Reactive validation for current step
  $: currentStepValid = isStepValid(currentStep, currentHostel);

  function isStepValid(step: number, hostel = currentHostel): boolean {
    switch (step) {
      case 1:
        return !!(hostel.name && hostel.name.trim() && hostel.gender);
      case 2:
        // Check both possible field names (for edit vs new hostel)
        // Use ?? to allow 0 values
        const totalBeds = hostel.totalBeds ?? hostel.capacity;
        const availableBeds = hostel.availableBeds ?? hostel.available;
        return !!(totalBeds > 0 && availableBeds >= 0 && hostel.location);
      case 3:
        return true; // Amenities are optional
      case 4:
        return true; // Description is optional
      default:
        return false;
    }
  }

  function addAmenity(amenity: string) {
    if (!currentHostel.amenities.includes(amenity)) {
      currentHostel.amenities = [...currentHostel.amenities, amenity];
    }
  }

  function removeAmenity(amenity: string) {
    currentHostel.amenities = currentHostel.amenities.filter((a: string) => a !== amenity);
  }

  function addCustomAmenity() {
    if (amenityInput.trim()) {
      addAmenity(amenityInput.trim());
      amenityInput = '';
    }
  }

  async function saveHostel() {
    try {
      // Ensure admin authentication before making API calls
      const user = ClientAuth.getUser();
      if (!user || user.role !== 'ADMIN') {
        error = 'Admin authentication required. Please log in again.';
        setTimeout(() => {
          goto('/auth/login');
        }, 2000);
        return;
      }

      // Convert form data to API format
      const hostelData = {
        ...currentHostel,
        // Use ?? (nullish coalescing) to allow 0 values
        capacity: currentHostel.totalBeds ?? currentHostel.capacity,
        available: currentHostel.availableBeds ?? currentHostel.available
      };
      
      // Validate
      if (!hostelData.name.trim()) {
        error = 'Hostel name is required';
        return;
      }

      if ((hostelData.totalBeds || hostelData.capacity) < 1) {
        error = 'Total beds must be at least 1';
        return;
      }

      if (editingHostel) {
        // Update existing hostel
        console.log('Updating hostel:', editingHostel.id, hostelData);
        const response = await ClientAuth.fetch(`/api/admin/hostels/${editingHostel.id}`, {
          method: 'PUT',
          body: JSON.stringify(hostelData)
        });

        console.log('Update response status:', response.status);
        if (response.ok) {
          const { hostel: updatedHostel } = await response.json();
          console.log('Updated hostel from server:', updatedHostel);
          
          // Calculate stats for the updated hostel
          const totalCapacity = updatedHostel.rooms?.reduce((sum: number, room: any) => sum + room.capacity, 0) || updatedHostel.capacity;
          const totalOccupied = updatedHostel.rooms?.reduce((sum: number, room: any) => sum + (room._count?.allocations || 0), 0) || 0;
          const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
          
          const hostelWithStats = {
            ...updatedHostel,
            totalCapacity,
            totalOccupied,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            totalBeds: totalCapacity,
            occupiedBeds: totalOccupied,
            // Use the actual available field from database, not calculated
            availableBeds: updatedHostel.available
          };
          
          // Update the hostel in the list with the server response
          hostels = hostels.map(h => h.id === editingHostel.id ? hostelWithStats : h);
          success = 'Hostel updated successfully';
          closeModal();
        } else if (response.status === 401) {
          error = 'Authentication expired. Please log in again.';
          setTimeout(() => {
            ClientAuth.clearAuth();
            goto('/auth/login');
          }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          console.error('Update failed:', errorData);
          error = errorData.error || 'Failed to update hostel';
        }
      } else {
        // Create new hostel
        console.log('Creating new hostel:', hostelData);
        const response = await ClientAuth.fetch('/api/admin/hostels', {
          method: 'POST',
          body: JSON.stringify(hostelData)
        });

        console.log('Create response status:', response.status);
        if (response.ok) {
          const { hostel: newHostel } = await response.json();
          console.log('Created hostel from server:', newHostel);
          
          // Calculate stats for the new hostel
          const totalCapacity = newHostel.rooms?.reduce((sum: number, room: any) => sum + room.capacity, 0) || newHostel.capacity;
          const totalOccupied = newHostel.rooms?.reduce((sum: number, room: any) => sum + (room._count?.allocations || 0), 0) || 0;
          const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
          
          const hostelWithStats = {
            ...newHostel,
            totalCapacity,
            totalOccupied,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            totalBeds: totalCapacity,
            occupiedBeds: totalOccupied,
            // Use the actual available field from database, not calculated
            availableBeds: newHostel.available
          };
          
          hostels = [...hostels, hostelWithStats];
          success = 'Hostel created successfully';
          closeModal();
        } else if (response.status === 401) {
          error = 'Authentication expired. Please log in again.';
          setTimeout(() => {
            ClientAuth.clearAuth();
            goto('/auth/login');
          }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          console.error('Create failed:', errorData);
          error = errorData.error || 'Failed to create hostel. Please try again.';
        }
      }

      if (success) {
        setTimeout(() => success = '', 3000);
      }
    } catch (err) {
      console.error('Save hostel error:', err);
      error = 'Network error: Failed to save hostel';
      setTimeout(() => error = '', 3000);
    }
  }

  function openDeleteModal(hostelId: string) {
    deleteHostelId = hostelId;
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    deleteHostelId = '';
  }

  async function deleteHostel() {
    if (!deleteHostelId) return;

    try {
      deleting = true;
      const response = await ClientAuth.fetch(`/api/admin/hostels/${deleteHostelId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        hostels = hostels.filter(h => h.id !== deleteHostelId);
        success = 'Hostel deleted successfully';
        closeDeleteModal();
      } else {
        error = 'Failed to delete hostel. Please try again.';
      }

      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = 'Failed to delete hostel';
      setTimeout(() => error = '', 3000);
    } finally {
      deleting = false;
    }
  }

  async function toggleHostelStatus(hostelId: string) {
    try {
      const hostel = hostels.find(h => h.id === hostelId);
      const newStatus = !hostel.isActive;

      const response = await ClientAuth.fetch(`/api/admin/hostels/${hostelId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        hostels = hostels.map(h => 
          h.id === hostelId ? { ...h, isActive: newStatus } : h
        );
        success = `Hostel ${newStatus ? 'activated' : 'deactivated'} successfully`;
      } else {
        error = `Failed to ${newStatus ? 'activate' : 'deactivate'} hostel. Please try again.`;
      }

      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = 'Failed to update hostel status';
      setTimeout(() => error = '', 3000);
    }
  }

  function getOccupancyRate(hostel: any) {
    // Use ?? to allow 0 values
    const total = hostel.totalBeds ?? hostel.capacity ?? 0;
    const available = hostel.availableBeds ?? hostel.available ?? 0;
    if (total === 0) return 0;
    
    const occupied = total - available;
    const actualRate = Math.round((occupied / total) * 100);
    
    // If available is 0, show 100%
    // Otherwise, cap at 99% even if fully booked
    if (available === 0) {
      return 100;
    } else if (actualRate >= 100) {
      return 99;
    }
    return actualRate;
  }

  function getOccupancyColor(rate: number) {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-green-600';
  }
</script>

<svelte:head>
  <title>Hostels Management - UNIPORT HAS Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-8 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Hostels Management</h1>
    <p class="text-gray-600">Manage hostel information, capacity, and amenities</p>
  </div>
  <button
    on:click={openAddModal}
    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
  >
    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
    Add Hostel
  </button>
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

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  </div>
{:else}
  <!-- Hostels Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each hostels as hostel}
      <div class="bg-white rounded-lg shadow border overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{hostel.name}</h3>
              <p class="text-sm text-gray-600">{hostel.location || 'No campus specified'}</p>
              {#if hostel.locationDescription}
                <p class="text-sm text-gray-500 mt-1">{hostel.locationDescription}</p>
              {/if}
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 {hostel.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : hostel.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}">
                {hostel.gender}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                {hostel.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-2xl font-bold text-gray-900">{hostel.totalBeds || 0}</div>
              <div class="text-sm text-gray-600">Total Beds</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{hostel.availableBeds || 0}</div>
              <div class="text-sm text-gray-600">Available</div>
            </div>
          </div>

          <!-- Occupancy Rate -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium text-gray-700">Occupancy</span>
              <span class="text-sm font-medium {getOccupancyColor(getOccupancyRate(hostel))}">
                {getOccupancyRate(hostel) || 0}%
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full {getOccupancyRate(hostel) >= 90 ? 'bg-red-500' : getOccupancyRate(hostel) >= 75 ? 'bg-yellow-500' : 'bg-green-500'}"
                style="width: {getOccupancyRate(hostel) || 0}%"
              ></div>
            </div>
          </div>

          <!-- Amenities -->
          <div class="mb-4">
            <div class="text-sm font-medium text-gray-700 mb-2">Amenities</div>
            <div class="flex flex-wrap gap-1">
              {#each hostel.amenities.slice(0, 3) as amenity}
                <span class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                  {amenity}
                </span>
              {/each}
              {#if hostel.amenities.length > 3}
                <span class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                  +{hostel.amenities.length - 3} more
                </span>
              {/if}
            </div>
          </div>

          <!-- Description -->
          {#if hostel.description}
            <p class="text-sm text-gray-600 mb-4">{hostel.description}</p>
          {/if}

          <!-- Actions -->
          <div class="flex space-x-2">
            <button
              on:click={() => openEditModal(hostel)}
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Edit
            </button>
            <button
              on:click={() => toggleHostelStatus(hostel.id)}
              class="flex-1 {hostel.isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {hostel.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              on:click={() => openDeleteModal(hostel.id)}
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              aria-label="Delete hostel {hostel.name}"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<!-- Add/Edit Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
        </h3>
        
        {#if !showPreview}
          <!-- Step Progress Bar -->
          <div class="mb-8">
            <div class="flex items-center">
              {#each Array(totalSteps) as _, i}
                <div class="flex items-center">
                  <div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep > i + 1 ? 'bg-green-500 text-white' : currentStep === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}">
                    {#if currentStep > i + 1}
                      ✓
                    {:else}
                      {i + 1}
                    {/if}
                  </div>
                  {#if i < totalSteps - 1}
                    <div class="w-20 h-1 {currentStep > i + 1 ? 'bg-green-500' : 'bg-gray-300'}"></div>
                  {/if}
                </div>
              {/each}
            </div>
            <div class="mt-2 flex justify-between text-sm text-gray-600">
              <span>Basic Info</span>
              <span>Capacity & Location</span>
              <span>Amenities</span>
              <span>Description</span>
            </div>
          </div>

          <form class="space-y-4">
            <!-- Step 1: Basic Information -->
            {#if currentStep === 1}
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-800 mb-4">Basic Information</h4>
                
                <!-- Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700">Hostel Name <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="name"
                    bind:value={currentHostel.name}
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter hostel name"
                  />
                </div>

                <!-- Gender -->
                <div>
                  <label for="gender" class="block text-sm font-medium text-gray-700">Gender <span class="text-red-500">*</span></label>
                  <select
                    id="gender"
                    bind:value={currentHostel.gender}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>
              </div>
            {/if}

            <!-- Step 2: Capacity & Location -->
            {#if currentStep === 2}
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-800 mb-4">Capacity & Location</h4>
                
                <!-- Total Beds -->
                <div>
                  <label for="totalBeds" class="block text-sm font-medium text-gray-700">Total Beds <span class="text-red-500">*</span></label>
                  <input
                    type="number"
                    id="totalBeds"
                    bind:value={currentHostel.totalBeds}
                    min="1"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Available Beds -->
                <div>
                  <label for="availableBeds" class="block text-sm font-medium text-gray-700">Available Beds <span class="text-red-500">*</span></label>
                  <input
                    type="number"
                    id="availableBeds"
                    bind:value={currentHostel.availableBeds}
                    min="0"
                    max={currentHostel.totalBeds}
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Location -->
                <div>
                  <label for="location" class="block text-sm font-medium text-gray-700">Campus Location <span class="text-red-500">*</span></label>
                  <select
                    id="location"
                    bind:value={currentHostel.location}
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a campus</option>
                    <option value="Abuja Campus">Abuja Campus</option>
                    <option value="Choba Campus">Choba Campus</option>
                    <option value="Delta Campus">Delta Campus</option>
                  </select>
                </div>

                <!-- Location Description -->
                <div>
                  <label for="locationDescription" class="block text-sm font-medium text-gray-700">Location Details</label>
                  <textarea
                    id="locationDescription"
                    bind:value={currentHostel.locationDescription}
                    rows="3"
                    placeholder="Provide more detailed description of the hostel's location (e.g., near faculty building, behind library, etc.)"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            {/if}

            <!-- Step 3: Amenities -->
            {#if currentStep === 3}
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-800 mb-4">Amenities</h4>
                
                <fieldset>
                  <legend class="block text-sm font-medium text-gray-700 mb-2">Select Available Amenities</legend>
                  
                  <!-- Selected Amenities -->
                  <div class="flex flex-wrap gap-2 mb-4">
                    {#each currentHostel.amenities as amenity}
                      <span class="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {amenity}
                        <button
                          type="button"
                          on:click={() => removeAmenity(amenity)}
                          class="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    {/each}
                    {#if currentHostel.amenities.length === 0}
                      <span class="text-gray-500 text-sm italic">No amenities selected yet</span>
                    {/if}
                  </div>

                  <!-- Available Amenities -->
                  <div class="grid grid-cols-2 gap-2 mb-4">
                    {#each availableAmenities as amenity}
                      {#if !currentHostel.amenities.includes(amenity)}
                        <button
                          type="button"
                          on:click={() => addAmenity(amenity)}
                          class="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                        >
                          + {amenity}
                        </button>
                      {/if}
                    {/each}
                  </div>

                  <!-- Custom Amenity -->
                  <div class="flex gap-2">
                    <input
                      type="text"
                      bind:value={amenityInput}
                      placeholder="Add custom amenity"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      on:click={addCustomAmenity}
                      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </fieldset>
              </div>
            {/if}

            <!-- Step 4: Description -->
            {#if currentStep === 4}
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-800 mb-4">Description & Final Details</h4>
                
                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700">Hostel Description</label>
                  <textarea
                    id="description"
                    bind:value={currentHostel.description}
                    rows="4"
                    placeholder="Provide a detailed description of the hostel, its features, and any important information for students..."
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <!-- Summary -->
                <div class="bg-gray-50 p-4 rounded-md">
                  <h5 class="text-sm font-medium text-gray-800 mb-2">Quick Summary:</h5>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li><strong>Name:</strong> {currentHostel.name || 'Not specified'}</li>
                    <li><strong>Gender:</strong> {currentHostel.gender}</li>
                    <li><strong>Capacity:</strong> {currentHostel.totalBeds} beds ({currentHostel.availableBeds} available)</li>
                    <li><strong>Location:</strong> {currentHostel.location || 'Not specified'}</li>
                    <li><strong>Amenities:</strong> {currentHostel.amenities.length} selected</li>
                  </ul>
                </div>
              </div>
            {/if}
          </form>

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-6 border-t">
            <div>
              {#if currentStep > 1}
                <button
                  type="button"
                  on:click={previousStep}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
              {/if}
            </div>

            <div class="flex space-x-3">
              <button
                type="button"
                on:click={closeModal}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {#if currentStep < totalSteps}
                <button
                  type="button"
                  on:click={nextStep}
                  disabled={!currentStepValid}
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              {:else}
                <button
                  type="button"
                  on:click={goToPreview}
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Preview
                </button>
              {/if}
            </div>
          </div>

        {:else}
          <!-- Preview Section -->
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-800">Preview Hostel Details</h4>
              <span class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">Ready to Submit</span>
            </div>

            <!-- Preview Card -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900">{currentHostel.name}</h3>
                    <p class="text-sm text-gray-600">{currentHostel.location || 'No campus specified'}</p>
                    {#if currentHostel.locationDescription}
                      <p class="text-sm text-gray-500 mt-1">{currentHostel.locationDescription}</p>
                    {/if}
                  </div>
                  <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full {currentHostel.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : currentHostel.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}">
                    {currentHostel.gender}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="bg-gray-50 p-3 rounded">
                    <div class="text-2xl font-bold text-gray-900">{currentHostel.totalBeds}</div>
                    <div class="text-sm text-gray-600">Total Beds</div>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <div class="text-2xl font-bold text-green-600">{currentHostel.availableBeds}</div>
                    <div class="text-sm text-gray-600">Available</div>
                  </div>
                </div>

                {#if currentHostel.amenities.length > 0}
                  <div class="mb-4">
                    <h5 class="text-sm font-medium text-gray-700 mb-2">Amenities:</h5>
                    <div class="flex flex-wrap gap-2">
                      {#each currentHostel.amenities as amenity}
                        <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{amenity}</span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if currentHostel.description}
                  <div>
                    <h5 class="text-sm font-medium text-gray-700 mb-2">Description:</h5>
                    <p class="text-sm text-gray-600">{currentHostel.description}</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between pt-4">
              <button
                type="button"
                on:click={goBackFromPreview}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back to Edit
              </button>
              
              <div class="flex space-x-3">
                <button
                  type="button"
                  on:click={closeModal}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  on:click={saveHostel}
                  class="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 shadow-sm"
                >
                  {editingHostel ? 'Update' : 'Create'} Hostel
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Delete Hostel Confirmation Modal -->
{#if showDeleteModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={closeDeleteModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900">
          Delete Hostel
        </h3>
        <button
          on:click={closeDeleteModal}
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
          Are you sure you want to delete this hostel?
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800 mb-2">
            <strong>⚠️ WARNING:</strong> This action cannot be undone!
          </p>
          <ul class="text-sm text-red-700 list-disc list-inside space-y-1">
            <li>All hostel data will be permanently deleted</li>
            <li>Students with active allocations may be affected</li>
            <li>Room and bed configurations will be lost</li>
          </ul>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
        <button
          on:click={closeDeleteModal}
          disabled={deleting}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={deleteHostel}
          disabled={deleting}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if deleting}
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          {:else}
            Delete Hostel
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

