// Test the hostel loading logic
const userProfile = {
  gender: 'MALE',
  name: 'Giddel Wilson'
};

const formData = {
  hostelGenderPreference: 'SAME_GENDER'
};

let genderParam = '';
if (userProfile?.gender && formData.hostelGenderPreference) {
  if (formData.hostelGenderPreference === 'SAME_GENDER') {
    genderParam = `?gender=${userProfile.gender}`;
  } else if (formData.hostelGenderPreference === 'MIXED') {
    genderParam = `?gender=MIXED`;
  }
} else if (userProfile?.gender) {
  // Fallback: load hostels matching user's gender
  genderParam = `?gender=${userProfile.gender}`;
}

const url = `/api/hostels${genderParam}`;
console.log('URL:', url);
console.log('Expected:', '/api/hostels?gender=MALE');
