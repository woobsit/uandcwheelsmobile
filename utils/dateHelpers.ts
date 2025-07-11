export const formatDate = (dateString: string, format: string) => {
  const date = new Date(dateString);
  
  switch (format) {
    case 'hh:mm a':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'MMM d, yyyy':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    default:
      return date.toLocaleString();
  }
};