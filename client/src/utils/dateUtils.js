const TIMEZONE = 'Europe/Rome';

/**
 * Get current time in Rome timezone
 */
function nowInRome() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Check if session is currently expired (Friday past 16:30 Rome time)
 */
export function isSessionExpiredClient() {
  const rome = nowInRome();
  const day = rome.getDay(); // 0=Sun, 5=Fri
  if (day === 5) {
    const hours = rome.getHours();
    const minutes = rome.getMinutes();
    return hours > 16 || (hours === 16 && minutes >= 30);
  }
  return false;
}
