/**
 * Utility helper to determine if a live visioconference session has ended.
 * Recorded video courses and text/PDF diploma formations NEVER expire automatically.
 */
export const isPastSession = (room: any): boolean => {
  if (!room) return false;
  
  // Recorded video replays and text/PDF diploma formations stay permanently in catalog
  if (room.type === 'video' || room.type === 'differe' || room.format === 'texte_pdf' || room.is_pdf_formation || room.id?.startsWith('fede-')) {
    return false;
  }

  // Only live sessions ('direct') check expiration date/time
  if (room.type !== 'direct') return false;

  const now = new Date();

  // 1. Check using ISO scheduled_at date if available
  if (room.scheduled_at) {
    const startDate = new Date(room.scheduled_at);
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + (room.duration_minutes || 60) * 60000);
      return now > endDate;
    }
  }

  // 2. Check using date (YYYY-MM-DD) and time (HH:MM) strings
  if (room.date && room.time) {
    try {
      const [y, m, d] = room.date.split('-').map(Number);
      const [hh, mm] = room.time.split(':').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(hh) && !isNaN(mm)) {
        const startDate = new Date(y, m - 1, d, hh, mm);
        const endDate = new Date(startDate.getTime() + (room.duration_minutes || 60) * 60000);
        return now > endDate;
      }
    } catch (e) {
      console.warn("Date parsing error in isPastSession:", e);
    }
  }

  return false;
};

/**
 * Filter out past live sessions from an array of classrooms.
 * Recorded videos and text/PDF diploma courses remain untouched.
 */
export const filterActiveSessions = <T extends Record<string, any>>(rooms: T[]): T[] => {
  if (!Array.isArray(rooms)) return [];
  return rooms.filter(room => !isPastSession(room));
};
