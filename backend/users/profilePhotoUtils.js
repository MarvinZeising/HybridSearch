// Color schemes for different departments
const departmentColors = {
  'Executive': 'b6e3f4',
  'Engineering': 'ffdfbf',
  'Finance': 'd1d4f9',
  'Marketing': 'ffd5dc',
  'HR': 'd4edda',
  'Sales': 'ffeaa7',
  'Operations': 'e8d5c4'
};

// Generate profile photo URL for a user
export function generateProfilePhoto(firstName, lastName, department) {
  const seed = `${firstName}${lastName}`;
  const backgroundColor = departmentColors[department] || 'b6e3f4';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${backgroundColor}`;
}

// Generate profile photo URL with custom seed
export function generateProfilePhotoWithSeed(seed, department) {
  const backgroundColor = departmentColors[department] || 'b6e3f4';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${backgroundColor}`;
}
