export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

export const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return "N/A";
  return timeStr; // Basic return for now, could be formatted further
};
