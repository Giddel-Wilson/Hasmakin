<!-- Hostel Application Form -->
<!-- University of Port Harcourt - Student Dashboard -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ClientAuth } from '$lib/auth';
  
  let loading = false;
  let hostels: any[] = [];
  let userProfile: any = null;
  let isInitialLoad = true;
  let applicationStatus: any = null;
  let showDeadlineModal = false;
  let formData = {
    hostelGenderPreference: '',
    hostelPreferences: ['', '', ''],
    specialNeeds: '',
    medicalConditions: '',
    roommate: {
      requested: false,
      matricNo: '',
      name: ''
    },
    declaration: false
  };
  
  let errors: Record<string, string> = {};
  let success = false;

  onMount(async () => {
    await checkApplicationStatus();
    await loadUserProfile();
    isInitialLoad = false;
  });

  async function checkApplicationStatus() {
    try {
      const response = await ClientAuth.fetch('/api/settings/application-status');
      if (response.ok) {
        applicationStatus = await response.json();
        console.log('Application status:', applicationStatus);
        
        // Show modal if applications are not open
        if (!applicationStatus.isOpen) {
          showDeadlineModal = true;
        }
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  }

  async function loadUserProfile() {
    try {
      const response = await ClientAuth.fetch('/api/student/profile');
      if (response.ok) {
        userProfile = await response.json();
        console.log('User profile loaded:', userProfile.gender);
        // Set hostel gender preference to user's gender by default
        if (userProfile.gender && !formData.hostelGenderPreference) {
          formData.hostelGenderPreference = 'SAME_GENDER';
        }
        // Load hostels after profile is loaded
        await loadHostels();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async function loadHostels() {
    try {
      let genderParam = '';
      if (userProfile?.gender && formData.hostelGenderPreference) {
        if (formData.hostelGenderPreference === 'SAME_GENDER') {
          genderParam = `?gender=${userProfile.gender}`;
        } else if (formData.hostelGenderPreference === 'MIXED') {
          genderParam = '?gender=MIXED';
        }
      } else if (userProfile?.gender) {
        // Fallback: load hostels matching user's gender
        genderParam = `?gender=${userProfile.gender}`;
      }
      
      console.log('Loading hostels with URL:', `/api/hostels${genderParam}`);
      const response = await ClientAuth.fetch(`/api/hostels${genderParam}`);
      if (response.ok) {
        const data = await response.json();
        hostels = Array.isArray(data) ? data : [];
        console.log('Loaded hostels:', hostels.length, hostels.map(h => h.name));
      } else {
        console.error('Failed to fetch hostels:', response.status);
        hostels = [];
      }
    } catch (error) {
      console.error('Failed to load hostels:', error);
      hostels = [];
    }
  }

  // Reload hostels when hostel gender preference changes (but not during initial load)
  $: if (!isInitialLoad && formData.hostelGenderPreference && userProfile) {
    loadHostels();
  }

  function validateForm() {
    errors = {};
    
    // Validate hostel gender preference
    if (!formData.hostelGenderPreference) {
      errors.hostelGenderPreference = 'Hostel gender preference is required';
    }
    
    // Validate hostel preferences (at least one required)
    if (!formData.hostelPreferences[0]) {
      errors.hostelPreferences = 'At least one hostel preference is required';
    }
    
    // Validate roommate details if requested
    if (formData.roommate.requested) {
      if (!formData.roommate.matricNo) {
        errors.roommateMatricNo = 'Roommate matric number is required';
      }
      if (!formData.roommate.name) {
        errors.roommateName = 'Roommate name is required';
      }
    }
    
    // Validate declaration
    if (!formData.declaration) {
      errors.declaration = 'You must accept the terms and conditions';
    }
    
    return Object.keys(errors).length === 0;
  }

  async function submitApplication() {
    if (!validateForm()) return;
    
    loading = true;
    errors = {}; // Clear all previous errors
    
    try {
      // Send form data with user's gender from profile
      const applicationData = {
        ...formData,
        gender: userProfile?.gender || 'MALE' // Use user's gender from profile
      };
      
      console.log('[Frontend] Submitting application:', {
        hasPreferences: !!applicationData.hostelPreferences,
        preferenceCount: applicationData.hostelPreferences?.length,
        hasGender: !!applicationData.gender,
        hasDeclaration: !!applicationData.declaration
      });
      
      const response = await ClientAuth.fetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
      
      console.log('[Frontend] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Application submitted successfully:', data);
        success = true;
        setTimeout(() => {
          goto('/dashboard');
        }, 2000);
      } else if (response.status === 401) {
        // Authentication failed - but don't immediately log out
        // ClientAuth.fetch already tried to refresh the token once
        console.error('[Frontend] Authentication failed (401) after refresh attempt');
        errors.submit = 'Authentication failed. Please try again. If this persists, please log out and log back in.';
      } else {
        // Handle validation or other errors
        const errorData = await response.json();
        console.error('[Frontend] Application submission error:', errorData);
        
        // Check if error has specific field validation errors
        if (errorData.fields) {
          // Merge field-specific errors
          errors = { ...errors, ...errorData.fields };
          errors.submit = 'Please correct the errors above and try again.';
        } else if (errorData.field === 'roommate') {
          // Roommate-specific error
          errors.roommateMatricNo = errorData.error || 'Invalid roommate';
        } else {
          // General error
          errors.submit = errorData.error || errorData.message || 'Failed to submit application. Please try again.';
        }
      }
    } catch (error) {
      console.error('[Frontend] Network or parsing error:', error);
      errors.submit = 'Network error. Please check your connection and try again.';
    } finally {
      loading = false;
    }
  }

  function removePreference(index: number) {
    formData.hostelPreferences[index] = '';
    formData.hostelPreferences = [...formData.hostelPreferences];
  }
</script>

<svelte:head>
  <title>Hostel Application - UNIPORT HAS</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
  <div class="mx-auto max-w-4xl">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-blue-900 mb-2">Hostel Application</h1>
      <p class="text-gray-600">University of Port Harcourt - 2024/2025 Academic Session</p>
    </div>

    {#if success}
      <!-- Success Message -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-emerald-800 mb-2">Application Submitted Successfully!</h2>
        <p class="text-emerald-600">
          Your hostel application has been submitted. You will be redirected to your dashboard shortly.
        </p>
      </div>
    {:else}
      <!-- Application Form -->
      <div class="bg-white rounded-lg shadow-lg p-8 relative {applicationStatus && !applicationStatus.isOpen ? 'opacity-50 pointer-events-none' : ''}">
        <form on:submit|preventDefault={submitApplication} class="space-y-8">
          
          <!-- Hostel Preferences -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">
              Hostel Preferences
            </h3>
            
            <div>
              <label for="hostelGenderPreference" class="block text-sm font-medium text-gray-700 mb-2">
                Hostel Gender Preference <span class="text-red-500">*</span>
              </label>
              <select 
                id="hostelGenderPreference"
                bind:value={formData.hostelGenderPreference}
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                class:border-red-300={errors.hostelGenderPreference}
              >
                <option value="">Select preference...</option>
                <option value="SAME_GENDER">Same Gender</option>
                <option value="MIXED">Mixed Gender</option>
              </select>
              {#if errors.hostelGenderPreference}
                <p class="mt-1 text-sm text-red-600">{errors.hostelGenderPreference}</p>
              {/if}
              <p class="mt-1 text-xs text-gray-500">
                Choose whether you prefer a hostel with only your gender or a mixed-gender hostel.
              </p>
            </div>
            
            <p class="text-sm text-gray-600">
              Select up to 3 hostels in order of preference. You can choose fewer if you prefer.
            </p>
            
            {#if hostels.length === 0 && formData.hostelGenderPreference}
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p class="text-sm text-amber-800">
                  {#if formData.hostelGenderPreference === 'MIXED'}
                    <strong>No mixed-gender hostels available.</strong> Please select "Same Gender" to see available hostels.
                  {:else}
                    <strong>No hostels available for your selection.</strong> Please try a different preference.
                  {/if}
                </p>
              </div>
            {/if}
            
            {#each formData.hostelPreferences as preference, index}
              <div class="flex items-center space-x-3">
                <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <select 
                  bind:value={formData.hostelPreferences[index]}
                  class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  class:border-red-300={errors.hostelPreferences && index === 0}
                  disabled={hostels.length === 0}
                >
                  <option value="" disabled selected>
                    {hostels.length === 0 ? 'No hostels available' : 'Select a hostel...'}
                  </option>
                  {#each hostels as hostel}
                    <option 
                      value={hostel.id} 
                      disabled={
                        (formData.hostelPreferences.includes(hostel.id) && formData.hostelPreferences[index] !== hostel.id) ||
                        (hostel.available !== null && hostel.available !== undefined && hostel.available === 0)
                      }
                    >
                      {hostel.name} - {hostel.location}{(hostel.available !== null && hostel.available !== undefined && hostel.available === 0) ? ' (Filled)' : ''}
                    </option>
                  {/each}
                </select>
                {#if preference}
                  <button 
                    type="button"
                    on:click={() => removePreference(index)}
                    class="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Clear selection"
                    title="Clear this preference"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                {:else}
                  <!-- Placeholder to maintain spacing when no X button -->
                  <div class="w-5 h-5"></div>
                {/if}
              </div>
            {/each}
            
            {#if errors.hostelPreferences}
              <p class="text-sm text-red-600">{errors.hostelPreferences}</p>
            {/if}
          </div>

          <!-- Special Needs -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">
              Special Requirements
            </h3>
            
            <div>
              <label for="specialNeeds" class="block text-sm font-medium text-gray-700 mb-2">
                Special Accommodation Needs (Optional)
              </label>
              <textarea 
                id="specialNeeds"
                bind:value={formData.specialNeeds}
                rows="3"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Ground floor room due to mobility issues, quiet environment for studies..."
              ></textarea>
            </div>
            
            <div>
              <label for="medicalConditions" class="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions/Allergies (Optional)
              </label>
              <textarea 
                id="medicalConditions"
                bind:value={formData.medicalConditions}
                rows="3"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Any medical conditions or allergies the hostel management should be aware of..."
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                This information will be kept confidential and used only for accommodation purposes.
              </p>
            </div>
          </div>

          <!-- Roommate Request -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">
              Roommate Request (Optional)
            </h3>
            
            <div class="flex items-center space-x-3">
              <input 
                id="roommateRequested"
                type="checkbox"
                bind:checked={formData.roommate.requested}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="roommateRequested" class="text-sm font-medium text-gray-700">
                I would like to request a specific roommate
              </label>
            </div>
            
            {#if formData.roommate.requested}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label for="roommateMatricNo" class="block text-sm font-medium text-gray-700 mb-2">
                    Roommate's Matric Number *
                  </label>
                  <input 
                    id="roommateMatricNo"
                    type="text"
                    bind:value={formData.roommate.matricNo}
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    class:border-red-300={errors.roommateMatricNo}
                    placeholder="e.g., 20220101001UG"
                  />
                  {#if errors.roommateMatricNo}
                    <p class="mt-1 text-sm text-red-600">{errors.roommateMatricNo}</p>
                  {/if}
                </div>
                
                <div>
                  <label for="roommateName" class="block text-sm font-medium text-gray-700 mb-2">
                    Roommate's Full Name *
                  </label>
                  <input 
                    id="roommateName"
                    type="text"
                    bind:value={formData.roommate.name}
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    class:border-red-300={errors.roommateName}
                    placeholder="Roommate's full name"
                  />
                  {#if errors.roommateName}
                    <p class="mt-1 text-sm text-red-600">{errors.roommateName}</p>
                  {/if}
                </div>
              </div>
              
              <div class="ml-6">
                <p class="text-sm text-gray-600">
                  <strong>Note:</strong> Your roommate must also apply for hostel accommodation and include your details in their application. 
                  Roommate requests are subject to availability and both parties must be allocated to the same hostel.
                </p>
              </div>
            {/if}
          </div>

          <!-- Declaration -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">
              Declaration and Terms
            </h3>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-2">Terms and Conditions:</h4>
              <ul class="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>I understand that hostel allocation is based on academic level, payment status, and availability.</li>
                <li>I agree to pay the required hostel fees before confirmation of allocation.</li>
                <li>I will confirm my allocation within 72 hours of notification or forfeit my space.</li>
                <li>I agree to abide by all hostel rules and regulations.</li>
                <li>I understand that providing false information may result in application rejection.</li>
                <li>I acknowledge that hostel allocation is not guaranteed and is subject to availability.</li>
              </ul>
            </div>
            
            <div class="flex items-start space-x-3">
              <input 
                id="declaration"
                type="checkbox"
                bind:checked={formData.declaration}
                class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                class:border-red-300={errors.declaration}
              />
              <label for="declaration" class="text-sm text-gray-700">
                I hereby declare that the information provided above is true and accurate to the best of my knowledge. 
                I agree to the terms and conditions stated above and understand the hostel allocation process.
              </label>
            </div>
            
            {#if errors.declaration}
              <p class="text-sm text-red-600">{errors.declaration}</p>
            {/if}
          </div>

          <!-- Submit Button -->
          <div class="flex items-center justify-between pt-6 border-t">
            <button 
              type="button"
              on:click={() => goto('/dashboard')}
              class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="submit"
              disabled={loading}
              class="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {#if loading}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              {:else}
                <span>Submit Application</span>
              {/if}
            </button>
          </div>
          
          {#if errors.submit}
            <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{errors.submit}</p>
            </div>
          {/if}
        </form>
      </div>
    {/if}
  </div>
</div>

<!-- Application Deadline Modal/Overlay -->
{#if showDeadlineModal && applicationStatus && !applicationStatus.isOpen}
  <div class="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="text-center">
        <!-- Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full {applicationStatus.status === 'not_started' ? 'bg-blue-100' : 'bg-red-100'} mb-4">
          <svg class="h-8 w-8 {applicationStatus.status === 'not_started' ? 'text-blue-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {#if applicationStatus.status === 'not_started'}
            Applications Not Yet Open
          {:else}
            Applications Closed
          {/if}
        </h3>

        <!-- Message -->
        <p class="text-sm text-gray-600 mb-4">
          {applicationStatus.message}
        </p>

        <!-- Date Info -->
        {#if applicationStatus.status === 'not_started' && applicationStatus.startDate}
          <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p class="text-xs font-medium text-blue-800 mb-1">Opens:</p>
            <p class="text-sm font-semibold text-blue-900">
              {new Date(applicationStatus.startDate).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </p>
            <p class="text-xs text-blue-700 mt-1">
              {new Date(applicationStatus.startDate).toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        {:else if applicationStatus.status === 'closed' && applicationStatus.deadline}
          <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p class="text-xs font-medium text-red-800 mb-1">Closed:</p>
            <p class="text-sm font-semibold text-red-900">
              {new Date(applicationStatus.deadline).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </p>
            <p class="text-xs text-red-700 mt-1">
              {new Date(applicationStatus.deadline).toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        {/if}

        <!-- Action Button -->
        <button
          on:click={() => goto('/dashboard')}
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Return to Dashboard
        </button>

        <!-- Contact Info -->
        <p class="text-xs text-gray-500 mt-4">
          For inquiries, please contact the hostel office.
        </p>
      </div>
    </div>
  </div>
{/if}

<!-- Gray Overlay on Form when Closed -->
{#if applicationStatus && !applicationStatus.isOpen && !showDeadlineModal}
  <div class="fixed inset-0 bg-gray-900 bg-opacity-60 z-40 pointer-events-none"></div>
{/if}
