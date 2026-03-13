const { DateTime } = require('luxon');

const TIMEZONE = 'Europe/Rome';
const SESSION_HOUR = 16;
const SESSION_END_MINUTE = 30;

function now() {
  return DateTime.now().setZone(TIMEZONE);
}

/**
 * Calculate the next session date based on current time in Rome timezone.
 * - Before Friday: this Friday
 * - Friday before 16:30: today (Friday)
 * - Friday after 16:30: next Friday
 * - Saturday/Sunday: next Friday
 */
function getNextSessionDate() {
  const current = now();
  const dayOfWeek = current.weekday; // 1=Mon, 5=Fri, 7=Sun

  if (dayOfWeek < 5) {
    // Mon-Thu: this Friday
    return current.set({ weekday: 5, hour: 0, minute: 0, second: 0, millisecond: 0 });
  }

  if (dayOfWeek === 5) {
    const sessionEnd = current.set({ hour: SESSION_HOUR, minute: SESSION_END_MINUTE, second: 0, millisecond: 0 });
    if (current < sessionEnd) {
      // Friday before 16:30: today
      return current.startOf('day');
    }
    // Friday after 16:30: next Friday
    return current.plus({ weeks: 1 }).set({ weekday: 5, hour: 0, minute: 0, second: 0, millisecond: 0 });
  }

  // Saturday (6) or Sunday (7): next Friday
  return current.plus({ weeks: 1 }).set({ weekday: 5, hour: 0, minute: 0, second: 0, millisecond: 0 });
}

/**
 * Format date in Italian: "venerdì 21 marzo 2026"
 */
function formatDateItalian(dt) {
  const days = ['', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  const months = ['', 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  return `${days[dt.weekday]} ${dt.day} ${months[dt.month]} ${dt.year}`;
}

/**
 * Check if the current session has expired (it's past Friday 16:30 Rome time)
 */
function isSessionExpired(sessionDateStr) {
  if (!sessionDateStr) return false;

  const current = now();
  const sessionDate = DateTime.fromISO(sessionDateStr, { zone: TIMEZONE });

  // The session expires at 16:30 on its date
  const expiryTime = sessionDate.set({ hour: SESSION_HOUR, minute: SESSION_END_MINUTE, second: 0 });

  return current >= expiryTime;
}

/**
 * Get session date as ISO string (date only)
 */
function getNextSessionDateISO() {
  return getNextSessionDate().toISODate();
}

module.exports = {
  now,
  getNextSessionDate,
  getNextSessionDateISO,
  formatDateItalian,
  isSessionExpired,
  TIMEZONE,
};
