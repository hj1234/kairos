// Distinct palette for user assignment (works on light and dark backgrounds)
const USER_COLORS = [
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#c026d3', // fuchsia-600
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#ca8a04', // yellow-600
  '#0891b2', // cyan-600
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
