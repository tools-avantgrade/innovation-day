const express = require('express');
const path = require('path');
const cors = require('cors');

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
app.use(express.static(clientDist));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[SERVER] TGII Booking running on port ${PORT}`);
  startResetCron();
});
