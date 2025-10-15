<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { ClientAuth } from '$lib/auth';
  import { countriesAndStates, countries, guardianRelationships } from '$lib/countries-states';

  interface UserProfile {
    id: string;
    name: string;
    email: string;
    matricNo: string;
    role: string;
    admissionYear: number | null;
    department: string | null;
    faculty: string | null;
    gender: string | null;
    religion: string | null;
    nationality: string | null;
    stateOfOrigin: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    guardianPhone1: string | null;
    guardianRelationship1: string | null;
    guardianPhone2: string | null;
    guardianRelationship2: string | null;
    currentLevel: string;
    levelDescription: string;
    createdAt: string;
    updatedAt: string;
  }

  let profile: UserProfile | null = null;
  let loading = true;
  let saving = false;
  let showPasswordForm = false;
  let message = '';
  let errorMessage = '';

  // Form data
  let formData = {
    name: '',
    email: '',
    department: '',
    faculty: '',
    gender: '',
    religion: '',
    nationality: '',
    stateOfOrigin: '',
    dateOfBirth: '',
    phoneNumber: '',
    guardianPhone1: '',
    guardianRelationship1: '',
    guardianPhone2: '',
    guardianRelationship2: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Nigerian states
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 
    'Yobe', 'Zamfara'
  ];

  // Common religions
  const commonReligions = [
    'Christianity', 'Islam', 'Traditional', 'Others', 'Prefer not to say'
  ];

  // Reactive statement for available states based on selected nationality
  $: availableStates = formData.nationality && countriesAndStates[formData.nationality]
    ? countriesAndStates[formData.nationality]
    : [];

  onMount(async () => {
    await loadProfile();
  });

  async function loadProfile() {
    try {
      loading = true;
      errorMessage = ''; // Clear any previous errors
      console.log('Loading profile...');
      
      console.log('Making API call to /api/student/profile');
      const response = await ClientAuth.fetch('/api/student/profile');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.log('Response not ok:', response.status);
        
        // Try to get the error message
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.log('Could not parse error response');
        }
        console.log('Error data:', errorData);
        
        // Don't automatically redirect here since the layout should handle auth
        errorMessage = errorData.error || 'Failed to load profile. Please refresh the page.';
        return;
      }

      profile = await response.json();
      console.log('Profile loaded:', profile);
      
      // Populate form data
      formData = {
        name: profile?.name || '',
        email: profile?.email || '',
        department: profile?.department || '',
        faculty: profile?.faculty || '',
        gender: profile?.gender || '',
        religion: profile?.religion || '',
        nationality: profile?.nationality || 'Nigeria',
        stateOfOrigin: profile?.stateOfOrigin || '',
        dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        phoneNumber: cleanPhoneNumber(profile?.phoneNumber || ''),
        guardianPhone1: cleanPhoneNumber(profile?.guardianPhone1 || ''),
        guardianRelationship1: profile?.guardianRelationship1 || '',
        guardianPhone2: cleanPhoneNumber(profile?.guardianPhone2 || ''),
        guardianRelationship2: profile?.guardianRelationship2 || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

    } catch (error) {
      console.error('Error loading profile:', error);
      errorMessage = 'Failed to load profile. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Manual refresh function for testing
  async function refreshAuth() {
    try {
      const refreshed = await ClientAuth.refreshTokens();
      if (refreshed) {
        message = 'Authentication refreshed successfully';
        await loadProfile();
      } else {
        errorMessage = 'Failed to refresh authentication';
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      errorMessage = 'Authentication refresh failed';
    }
  }

  // Clean phone number input automatically
  function cleanPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    // Remove all spaces except one after country code
    return phoneNumber
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^\+(\d{3})\s+/, '+$1 ') // Ensure single space after country code
      .trim();
  }

  // Handle phone number input changes
  function handlePhoneNumberInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const cleaned = cleanPhoneNumber(target.value);
    formData.phoneNumber = cleaned;
    target.value = cleaned;
  }

  async function saveProfile() {
    if (saving) return;

    // Validation
    if (!formData.name.trim()) {
      errorMessage = 'Name is required';
      return;
    }

    if (!formData.email.trim()) {
      errorMessage = 'Email is required';
      return;
    }

    // Password confirmation check
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      errorMessage = 'Password confirmation does not match';
      return;
    }

    try {
      saving = true;
      errorMessage = '';
      message = '';

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department || null,
        faculty: formData.faculty || null,
        gender: formData.gender || null,
        religion: formData.religion || null,
        nationality: formData.nationality || null,
        stateOfOrigin: formData.stateOfOrigin || null,
        dateOfBirth: formData.dateOfBirth || null,
        phoneNumber: formData.phoneNumber || null,
        guardianPhone1: formData.guardianPhone1 || null,
        guardianRelationship1: formData.guardianRelationship1 || null,
        guardianPhone2: formData.guardianPhone2 || null,
        guardianRelationship2: formData.guardianRelationship2 || null
      };

      // Add password fields if updating password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await ClientAuth.fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      message = 'Profile updated successfully!';
      profile = result.user;
      
      // Clear password fields
      formData.currentPassword = '';
      formData.newPassword = '';
      formData.confirmPassword = '';
      showPasswordForm = false;

    } catch (error) {
      console.error('Error updating profile:', error);
      errorMessage = (error as Error).message || 'Failed to update profile. Please try again.';
    } finally {
      saving = false;
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Profile Settings - Student Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
      <p class="text-gray-600">Manage your personal information and account settings</p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if profile}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Summary Card -->
        <div class="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <div class="text-sm font-medium text-gray-500">Name</div>
                <div class="text-lg font-semibold">{profile.name}</div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500">Matriculation No</div>
                <div class="font-mono">{profile.matricNo}</div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500">Current Level</div>
                <div class="text-lg font-semibold text-blue-600">{profile.levelDescription}</div>
              </div>
              {#if profile.admissionYear}
                <div>
                  <div class="text-sm font-medium text-gray-500">Admission Year</div>
                  <div>{profile.admissionYear}</div>
                </div>
              {/if}
              <div>
                <div class="text-sm font-medium text-gray-500">Account Created</div>
                <div class="text-sm">{formatDate(profile.createdAt)}</div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500">Last Updated</div>
                <div class="text-sm">{formatDate(profile.updatedAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Main Form -->
        <div class="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              {#if message}
                <div class="bg-green-50 border border-green-200 rounded-md p-4">
                  <div class="text-green-800">{message}</div>
                </div>
              {/if}

              {#if errorMessage}
                <div class="bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="text-red-800">{errorMessage}</div>
                  <div class="mt-2">
                    <button
                      type="button"
                      class="text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                      on:click={refreshAuth}
                    >
                      Try Refresh Authentication
                    </button>
                    <button
                      type="button"
                      class="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded ml-2"
                      on:click={loadProfile}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              {/if}

              <form on:submit|preventDefault={saveProfile} class="space-y-6">
                <!-- Basic Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      bind:value={formData.name}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      bind:value={formData.email}
                      required
                      placeholder="your.email@uniport.edu.ng"
                    />
                  </div>
                </div>

                <!-- Academic Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="faculty" class="block text-sm font-medium text-gray-700 mb-2">
                      Faculty
                    </label>
                    <Input
                      id="faculty"
                      type="text"
                      bind:value={formData.faculty}
                      placeholder="e.g., Faculty of Engineering"
                    />
                  </div>

                  <div>
                    <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <Input
                      id="department"
                      type="text"
                      bind:value={formData.department}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <!-- Personal Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="gender" class="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span class="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      bind:value={formData.gender}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div>
                    <label for="religion" class="block text-sm font-medium text-gray-700 mb-2">
                      Religion
                    </label>
                    <select
                      id="religion"
                      bind:value={formData.religion}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select religion</option>
                      {#each commonReligions as religion}
                        <option value={religion}>{religion}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <!-- Location Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="nationality" class="block text-sm font-medium text-gray-700 mb-2">
                      Nationality
                    </label>
                    <select
                      id="nationality"
                      bind:value={formData.nationality}
                      on:change={() => {
                        // Reset state when nationality changes
                        formData.stateOfOrigin = '';
                      }}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select country</option>
                      {#each countries as country}
                        <option value={country}>{country}</option>
                      {/each}
                    </select>
                  </div>

                  <div>
                    <label for="stateOfOrigin" class="block text-sm font-medium text-gray-700 mb-2">
                      State/Province of Origin
                    </label>
                    <select
                      id="stateOfOrigin"
                      bind:value={formData.stateOfOrigin}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.nationality}
                    >
                      <option value="">
                        {formData.nationality ? 'Select state/province' : 'Select nationality first'}
                      </option>
                      {#each availableStates as state}
                        <option value={state}>{state}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <!-- Contact Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      bind:value={formData.phoneNumber}
                      on:input={handlePhoneNumberInput}
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>

                  <div>
                    <label for="dateOfBirth" class="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      bind:value={formData.dateOfBirth}
                    />
                  </div>
                </div>

                <!-- Guardian/Parent Contact Information -->
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-3">Guardian/Parent Phone Numbers</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="guardianRelationship1" class="block text-sm font-medium text-gray-600 mb-2">
                        Relationship 1
                      </label>
                      <select
                        id="guardianRelationship1"
                        bind:value={formData.guardianRelationship1}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select relationship</option>
                        {#each guardianRelationships as relationship}
                          <option value={relationship}>{relationship}</option>
                        {/each}
                      </select>
                    </div>

                    <div>
                      <label for="guardianPhone1" class="block text-sm font-medium text-gray-600 mb-2">
                        Phone Number 1
                      </label>
                      <Input
                        id="guardianPhone1"
                        type="tel"
                        bind:value={formData.guardianPhone1}
                        on:input={(e) => {
                          const target = e.target as HTMLInputElement;
                          formData.guardianPhone1 = cleanPhoneNumber(target.value);
                        }}
                        placeholder="+234 xxx xxx xxxx"
                      />
                    </div>

                    <div>
                      <label for="guardianRelationship2" class="block text-sm font-medium text-gray-600 mb-2">
                        Relationship 2
                      </label>
                      <select
                        id="guardianRelationship2"
                        bind:value={formData.guardianRelationship2}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select relationship</option>
                        {#each guardianRelationships as relationship}
                          <option value={relationship}>{relationship}</option>
                        {/each}
                      </select>
                    </div>

                    <div>
                      <label for="guardianPhone2" class="block text-sm font-medium text-gray-600 mb-2">
                        Phone Number 2
                      </label>
                      <Input
                        id="guardianPhone2"
                        type="tel"
                        bind:value={formData.guardianPhone2}
                        on:input={(e) => {
                          const target = e.target as HTMLInputElement;
                          formData.guardianPhone2 = cleanPhoneNumber(target.value);
                        }}
                        placeholder="+234 xxx xxx xxxx"
                      />
                    </div>
                  </div>
                </div>

                <!-- Password Section -->
                <div class="border-t pt-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium">Password Settings</h3>
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                      on:click={() => showPasswordForm = !showPasswordForm}
                    >
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {#if showPasswordForm}
                    <div class="space-y-4 bg-gray-50 p-4 rounded-md">
                      <div>
                        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
                          Current Password *
                        </label>
                        <Input
                          id="currentPassword"
                          type="password"
                          bind:value={formData.currentPassword}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
                            New Password *
                          </label>
                          <Input
                            id="newPassword"
                            type="password"
                            bind:value={formData.newPassword}
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password *
                          </label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            bind:value={formData.confirmPassword}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>

                <!-- Submit Button -->
                <div class="flex justify-end pt-6">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-gray-500">Failed to load profile. Please refresh the page.</div>
      </div>
    {/if}
  </div>
</div>
