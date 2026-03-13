const cron = require('node-cron');
const db = require('../db/database');
const { getNextSessionDateISO, TIMEZONE } = require('../utils/dateUtils');

/**
 * Archive booked slots to history before resetting
 */
function archiveAndReset() {
  const slots = db.prepare('SELECT * FROM slots WHERE speaker IS NOT NULL').all();

  if (slots.length === 0) {
    console.log('[CRON] No booked slots to reset.');
    return;
  }

  const insertHistory = db.prepare(
    'INSERT INTO history (slot_id, speaker, topic, session_date) VALUES (?, ?, ?, ?)'
  );
  const resetSlot = db.prepare(
    'UPDATE slots SET speaker = NULL, topic = NULL, booked_at = NULL, session_date = NULL WHERE id = ?'
  );

  const transaction = db.transaction(() => {
    for (const slot of slots) {
      if (slot.speaker && slot.session_date) {
        insertHistory.run(slot.id, slot.speaker, slot.topic, slot.session_date);
      }
      resetSlot.run(slot.id);
    }
  });

  transaction();
  console.log(`[CRON] Archived ${slots.length} slot(s) and reset for next session.`);
}

/**
 * Start the cron job: runs every Friday at 16:31 Europe/Rome
 */
function startResetCron() {
  // node-cron: minute hour dayOfMonth month dayOfWeek
  // 31 16 * * 5 = Friday at 16:31
  cron.schedule('31 16 * * 5', () => {
    console.log(`[CRON] Friday 16:31 - Resetting slots...`);
    archiveAndReset();
  }, {
    timezone: TIMEZONE,
  });

  console.log('[CRON] Reset job scheduled for every Friday at 16:31 Europe/Rome.');
}

module.exports = { startResetCron, archiveAndReset };
