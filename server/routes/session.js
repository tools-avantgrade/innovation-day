const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getNextSessionDate, getNextSessionDateISO, formatDateItalian, isSessionExpired } = require('../utils/dateUtils');
const { archiveAndReset } = require('../cron/resetJob');

const SLOT_TIMES = {
  1: { start: '16:00', end: '16:10' },
  2: { start: '16:10', end: '16:20' },
  3: { start: '16:20', end: '16:30' },
};

/**
 * Check if slots need auto-reset (lazy reset on access)
 */
function checkAndResetIfExpired() {
  const anySlot = db.prepare('SELECT session_date FROM slots WHERE session_date IS NOT NULL LIMIT 1').get();
  if (anySlot && isSessionExpired(anySlot.session_date)) {
    console.log('[AUTO-RESET] Session expired, resetting slots...');
    archiveAndReset();
  }
}

/**
 * GET /api/session
 * Returns current session data with slots and next session date
 */
router.get('/session', (req, res) => {
  checkAndResetIfExpired();

  const nextSession = getNextSessionDate();
  const nextSessionFormatted = formatDateItalian(nextSession);
  const nextSessionISO = nextSession.toISODate();

  const slots = db.prepare('SELECT * FROM slots ORDER BY id').all();

  const formattedSlots = slots.map((slot) => ({
    id: slot.id,
    timeStart: SLOT_TIMES[slot.id].start,
    timeEnd: SLOT_TIMES[slot.id].end,
    speaker: slot.speaker || null,
    topic: slot.topic || null,
    bookedAt: slot.booked_at || null,
    isBooked: !!slot.speaker,
  }));

  res.json({
    nextSession: nextSessionFormatted,
    nextSessionISO,
    slots: formattedSlots,
    bookedCount: formattedSlots.filter((s) => s.isBooked).length,
  });
});

/**
 * POST /api/session/book
 * Book a slot: { slotId, speaker, topic }
 */
router.post('/session/book', (req, res) => {
  const { slotId, speaker, topic } = req.body;

  if (!slotId || !speaker || !topic) {
    return res.status(400).json({ error: 'slotId, speaker, and topic are required.' });
  }

  if (![1, 2, 3].includes(Number(slotId))) {
    return res.status(400).json({ error: 'slotId must be 1, 2, or 3.' });
  }

  const trimmedSpeaker = speaker.trim();
  const trimmedTopic = topic.trim();

  if (!trimmedSpeaker || !trimmedTopic) {
    return res.status(400).json({ error: 'Speaker and topic cannot be empty.' });
  }

  checkAndResetIfExpired();

  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(Number(slotId));

  if (slot.speaker) {
    return res.status(409).json({ error: 'This slot is already booked.' });
  }

  const sessionDate = getNextSessionDateISO();
  const now = new Date().toISOString();

  db.prepare('UPDATE slots SET speaker = ?, topic = ?, booked_at = ?, session_date = ? WHERE id = ?')
    .run(trimmedSpeaker, trimmedTopic, now, sessionDate, Number(slotId));

  res.json({ success: true, message: `Slot ${slotId} booked by ${trimmedSpeaker}.` });
});

/**
 * POST /api/session/cancel
 * Cancel a booking: { slotId }
 */
router.post('/session/cancel', (req, res) => {
  const { slotId } = req.body;

  if (!slotId || ![1, 2, 3].includes(Number(slotId))) {
    return res.status(400).json({ error: 'Valid slotId (1-3) is required.' });
  }

  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(Number(slotId));

  if (!slot.speaker) {
    return res.status(400).json({ error: 'This slot is not booked.' });
  }

  db.prepare('UPDATE slots SET speaker = NULL, topic = NULL, booked_at = NULL, session_date = NULL WHERE id = ?')
    .run(Number(slotId));

  res.json({ success: true, message: `Slot ${slotId} cancelled.` });
});

/**
 * POST /api/session/reset
 * Reset all slots (admin/manual reset)
 */
router.post('/session/reset', (req, res) => {
  archiveAndReset();
  res.json({ success: true, message: 'All slots have been reset.' });
});

/**
 * GET /api/history
 * Get past sessions history
 */
router.get('/history', (req, res) => {
  const history = db.prepare(
    'SELECT * FROM history ORDER BY session_date DESC, slot_id ASC LIMIT 100'
  ).all();

  res.json({ history });
});

/**
 * GET /api/health
 * Health check for Railway
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
