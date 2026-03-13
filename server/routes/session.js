const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('../db/database');
const { getNextSessionDate, getNextSessionDateISO, formatDateItalian, isSessionExpired } = require('../utils/dateUtils');
const { archiveAndReset } = require('../cron/resetJob');
const { analyzeTranscript } = require('../services/aiSummary');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
 */
router.post('/session/reset', (req, res) => {
  archiveAndReset();
  res.json({ success: true, message: 'All slots have been reset.' });
});

/**
 * GET /api/history
 */
router.get('/history', (req, res) => {
  const history = db.prepare(
    'SELECT * FROM history ORDER BY session_date DESC, slot_id ASC LIMIT 100'
  ).all();

  res.json({ history });
});

/**
 * GET /api/leaderboard
 * Returns speakers ranked by number of participations, with their history
 */
router.get('/leaderboard', (req, res) => {
  const leaderboard = db.prepare(`
    SELECT speaker, COUNT(*) as sessions,
           GROUP_CONCAT(session_date, '||') as dates
    FROM history
    GROUP BY LOWER(speaker)
    ORDER BY sessions DESC, MAX(session_date) DESC
  `).all();

  const result = leaderboard.map((row) => ({
    speaker: row.speaker,
    sessions: row.sessions,
    dates: row.dates ? row.dates.split('||') : [],
  }));

  res.json({ leaderboard: result });
});

/**
 * GET /api/speaker/:name
 * Returns full history and summaries for a specific speaker
 */
router.get('/speaker/:name', (req, res) => {
  const name = req.params.name;

  const talks = db.prepare(`
    SELECT h.session_date, h.topic, h.slot_id, s.summary
    FROM history h
    LEFT JOIN summaries s ON LOWER(s.speaker) = LOWER(h.speaker) AND s.session_date = h.session_date
    WHERE LOWER(h.speaker) = LOWER(?)
    ORDER BY h.session_date DESC
  `).all(name);

  if (talks.length === 0) {
    return res.status(404).json({ error: 'Speaker not found.' });
  }

  res.json({
    speaker: name,
    totalSessions: talks.length,
    talks: talks.map((t) => ({
      sessionDate: t.session_date,
      topic: t.topic,
      slotId: t.slot_id,
      summary: t.summary || null,
    })),
  });
});

/**
 * POST /api/transcript/upload
 * Upload a transcript file (text) for a session and trigger AI analysis
 */
router.post('/transcript/upload', upload.single('transcript'), async (req, res) => {
  try {
    const sessionDate = req.body.sessionDate;

    if (!sessionDate) {
      return res.status(400).json({ error: 'sessionDate is required.' });
    }

    let transcriptText;

    if (req.file) {
      transcriptText = req.file.buffer.toString('utf-8');
    } else if (req.body.text) {
      transcriptText = req.body.text;
    } else {
      return res.status(400).json({ error: 'Transcript file or text is required.' });
    }

    if (!transcriptText.trim()) {
      return res.status(400).json({ error: 'Transcript cannot be empty.' });
    }

    // Save the raw transcript
    db.prepare(`
      INSERT OR REPLACE INTO transcripts (session_date, raw_text, uploaded_at)
      VALUES (?, ?, datetime('now'))
    `).run(sessionDate, transcriptText);

    // Get speakers for this session from history
    const speakers = db.prepare(
      'SELECT speaker, topic FROM history WHERE session_date = ?'
    ).all(sessionDate);

    if (speakers.length === 0) {
      return res.json({
        success: true,
        message: 'Transcript saved, but no speakers found in history for this date. AI summary skipped.',
        summaries: [],
      });
    }

    // Check if ANTHROPIC_API_KEY is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        success: true,
        message: 'Transcript saved. Set ANTHROPIC_API_KEY to enable AI summaries.',
        summaries: [],
      });
    }

    // Analyze with Claude
    const summaries = await analyzeTranscript(transcriptText, speakers);

    // Save summaries
    const insertSummary = db.prepare(`
      INSERT OR REPLACE INTO summaries (session_date, speaker, summary, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    // Delete old summaries for this session
    db.prepare('DELETE FROM summaries WHERE session_date = ?').run(sessionDate);

    for (const s of summaries) {
      insertSummary.run(sessionDate, s.speaker, s.summary);
    }

    res.json({
      success: true,
      message: `Transcript analyzed. ${summaries.length} summaries generated.`,
      summaries,
    });
  } catch (err) {
    console.error('[TRANSCRIPT] Error:', err.message);
    res.status(500).json({ error: 'Failed to process transcript: ' + err.message });
  }
});

/**
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
