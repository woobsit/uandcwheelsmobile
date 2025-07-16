// utils/dateHelpers.ts
export const formatDate = (dateInput: Date | string | number, format: string): string => {
  // Convert to Date object if it's a string or number
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  // Handle invalid dates
  if (isNaN(date.getTime())) return 'Invalid Date';

  switch (format) {
    case 'hh:mm a':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'HH:mm':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    case 'MMM d, yyyy':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    case 'EEE, MMM d':
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    case 'relative':
      // Add relative time formatting if needed
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      if (diffHours < 24) return 'Today';
      if (diffHours < 48) return 'Tomorrow';
      return date.toLocaleDateString();
    default:
      return date.toLocaleString();
  }
};
