# Hostel Dropdown Fix - Empty Hostel List Issue

## Problem
The hostel dropdowns in the application form were showing "Select a hostel..." but no actual hostel options were appearing, even though hostels existed in the database.

## Root Causes Identified

### 1. Race Condition in Data Loading
The reactive statement was triggering `loadHostels()` during the initial mount process, potentially causing interference with the explicit call to `loadHostels()` after the profile was loaded.

```typescript
// This was triggering during initial load:
$: if (formData.hostelGenderPreference && userProfile) {
  loadHostels();
}
```

### 2. Timing Issues
The sequence of operations was:
1. Mount → Load user profile
2. Set hostelGenderPreference to 'SAME_GENDER'
3. Call loadHostels() explicitly
4. Reactive statement also triggers loadHostels() (potential race condition)

### 3. Missing Error Handling Feedback
The original code didn't have proper console logging to debug what was happening during the load process.

## Solutions Implemented

### 1. Added Initial Load Flag
```typescript
let isInitialLoad = true;

onMount(async () => {
  await loadUserProfile();
  isInitialLoad = false; // Prevent reactive statement from firing during mount
});

// Modified reactive statement:
$: if (!isInitialLoad && formData.hostelGenderPreference && userProfile) {
  loadHostels();
}
```

This prevents the reactive statement from triggering during the initial mount sequence, avoiding race conditions.

### 2. Enhanced Debugging
Added console logs to track the loading process:
```typescript
console.log('User profile loaded:', userProfile.gender);
console.log('Loading hostels with URL:', `/api/hostels${genderParam}`);
console.log('Loaded hostels:', hostels.length, hostels.map(h => h.name));
```

### 3. Better Error Handling
```typescript
const data = await response.json();
hostels = Array.isArray(data) ? data : []; // Ensure hostels is always an array
```

### 4. User Feedback for Empty Results
Added warning message when no hostels are available:
```svelte
{#if hostels.length === 0 && formData.hostelGenderPreference}
  <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <p class="text-sm text-amber-800">
      {#if formData.hostelGenderPreference === 'MIXED'}
        <strong>No mixed-gender hostels available.</strong> 
        Please select "Same Gender" to see available hostels.
      {:else}
        <strong>No hostels available for your selection.</strong> 
        Please try a different preference.
      {/if}
    </p>
  </div>
{/if}
```

### 5. Disabled Dropdowns When Empty
```svelte
<select 
  disabled={hostels.length === 0}
>
  <option value="">
    {hostels.length === 0 ? 'No hostels available' : 'Select a hostel...'}
  </option>
```

## Files Modified

### `/src/routes/dashboard/apply/+page.svelte`

**Changes:**
1. Added `isInitialLoad` flag to prevent reactive statement race condition
2. Added console logging for debugging
3. Modified reactive statement to only trigger after initial load
4. Added user feedback for empty hostel lists
5. Disabled hostel dropdowns when no hostels are available
6. Improved error handling to ensure `hostels` is always an array

## Testing Results

### User Context
- **Student:** Giddel Wilson
- **Matric:** U2021/5570004  
- **Gender:** MALE

### Available Hostels
- **MALE hostels:** 2 (Alvan Ikoku Hall, Kenneth Dike Hall)
- **FEMALE hostels:** 2 (Eleanor Roosevelt Hall, Queen Amina Hall)
- **MIXED hostels:** 0

### Expected Behavior
1. Page loads → User profile fetched
2. hostelGenderPreference set to 'SAME_GENDER' by default
3. Hostels loaded with filter: `?gender=MALE`
4. 2 MALE hostels displayed in dropdowns
5. If user changes to 'MIXED', warning shown (no MIXED hostels available)

## Console Output (Expected)
```
User profile loaded: MALE
Loading hostels with URL: /api/hostels?gender=MALE
Loaded hostels: 2 ['Alvan Ikoku Hall', 'Kenneth Dike Hall']
```

## API Verification

### Test MALE Hostels
```bash
curl 'http://localhost:5173/api/hostels?gender=MALE' | jq '. | length'
# Output: 2
```

### Test MIXED Hostels  
```bash
curl 'http://localhost:5173/api/hostels?gender=MIXED' | jq '. | length'
# Output: 0
```

## Known Limitations

1. **No MIXED Gender Hostels:** Currently there are no MIXED gender hostels in the database. If a student selects "Mixed Gender", they will see a warning message.

2. **First-Time Load:** The first time the page loads, there might be a brief moment where the dropdowns show "Select a hostel..." before the API call completes.

## Future Improvements

1. Add loading skeleton/spinner while hostels are being fetched
2. Cache hostel data to avoid repeated API calls
3. Add mixed-gender hostels to the database if the university supports them
4. Pre-load hostel data on the dashboard for faster application experience

## Troubleshooting

If hostels still don't load:

1. **Check browser console** for error messages
2. **Verify user has gender set** in their profile
3. **Test API directly:** `curl 'http://localhost:5173/api/hostels?gender=MALE'`
4. **Check database:** Ensure hostels exist with correct gender values
5. **Clear browser cache** and refresh the page
