/**
 * Format a date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Format a time string to HH:MM format
 * @param {string} timeStr - Time string to format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Handle different time formats
  if (timeStr.includes('T')) {
    // ISO format
    return timeStr.split('T')[1].substring(0, 5);
  } else if (timeStr.includes(':')) {
    // Already in HH:MM format
    return timeStr.substring(0, 5);
  }
  
  return timeStr;
};

/**
 * Get the day of week for a date (0 = Sunday, 6 = Saturday)
 * @param {Date} date - Date object
 * @returns {number} Day of week (0-6)
 */
export const getDayOfWeek = (date) => {
  return date.getDay();
};

/**
 * Get the next instance date based on recurrence pattern
 * @param {string} recurrenceType - Type of recurrence (daily, weekly, monthly, custom)
 * @param {Date} currentDate - Current date
 * @param {Array} recurringDays - Array of days for weekly recurrence (0-6)
 * @param {number} interval - Interval for recurrence
 * @returns {Date} Next instance date
 */
export const getNextInstanceDate = (recurrenceType, currentDate, recurringDays = [], interval = 1) => {
  const nextDate = new Date(currentDate);
  
  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
      
    case 'weekly':
      if (recurringDays && recurringDays.length > 0) {
        // Find the next day in the recurring days
        const currentDay = nextDate.getDay();
        let nextDay = -1;
        
        // Convert recurring days to numbers if they're strings
        const recurringDaysNumbers = recurringDays.map(day => 
          typeof day === 'string' ? parseInt(day, 10) : day
        );
        
        // Sort the days
        const sortedDays = [...recurringDaysNumbers].sort((a, b) => a - b);
        
        // Find the next day in the sequence
        for (const day of sortedDays) {
          if (day > currentDay) {
            nextDay = day;
            break;
          }
        }
        
        // If no next day found, take the first day in the next week
        if (nextDay === -1 && sortedDays.length > 0) {
          nextDay = sortedDays[0];
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay));
        } else if (nextDay !== -1) {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
        } else {
          // Fallback: just add 7 days if no recurring days specified
          nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
      } else {
        // If no specific days, just add 7 days
        nextDate.setDate(nextDate.getDate() + (7 * interval));
      }
      break;
      
    case 'monthly':
      // Keep the same day of month, but increment month
      const dayOfMonth = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + interval);
      
      // Handle month length differences
      const newMonth = nextDate.getMonth();
      nextDate.setDate(1); // Set to first day to avoid date overflow
      nextDate.setMonth(newMonth); // Set the correct month
      
      // Try to set the original day, but cap at month end
      const lastDayOfMonth = new Date(nextDate.getFullYear(), newMonth + 1, 0).getDate();
      nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      break;
      
    case 'custom':
      // For custom, just add the interval days
      nextDate.setDate(nextDate.getDate() + interval);
      break;
      
    default:
      // Default to adding one day
      nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
};

/**
 * Check if a date is valid for a recurrence pattern
 * @param {Date} date - Date to check
 * @param {string} recurrenceType - Type of recurrence
 * @param {Array} recurringDays - Array of days for weekly recurrence
 * @returns {boolean} Whether the date is valid
 */
export const isValidRecurrenceDate = (date, recurrenceType, recurringDays = []) => {
  if (recurrenceType === 'weekly' && recurringDays && recurringDays.length > 0) {
    const dayOfWeek = date.getDay();
    return recurringDays.includes(dayOfWeek) || recurringDays.includes(dayOfWeek.toString());
  }
  
  return true;
};

/**
 * Calculate the end time based on start time and duration
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in HH:MM format
 */
export const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};
