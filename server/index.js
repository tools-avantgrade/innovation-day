const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Initialize database (creates tables on first run)
require('./db/database');

const sessionRoutes = require('./routes/session');
const { startResetCron } = require('./cron/resetJob');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', sessionRoutes);

// Serve static files from React build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
} else {
  console.warn('[SERVER] client/dist not found — serving API only');
}

// Start server — bind to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] TGII Booking running on 0.0.0.0:${PORT}`);
  startResetCron();
});
