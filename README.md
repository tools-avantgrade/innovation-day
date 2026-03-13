# TGII - Thank God It's Innovation

Booking portal for AvantGrade.com's weekly knowledge sharing sessions.

Every Friday at 16:00, 3 team members share 10-minute talks on any topic.

## Stack

- **Frontend**: React (Vite) - dark/premium design
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Deploy**: Railway

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/session` | Get current session with slots |
| POST | `/api/session/book` | Book a slot `{ slotId, speaker, topic }` |
| POST | `/api/session/cancel` | Cancel a booking `{ slotId }` |
| POST | `/api/session/reset` | Reset all slots |
| GET | `/api/history` | Get past sessions |
| GET | `/api/health` | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `TZ` | `Europe/Rome` | Timezone |
| `DB_PATH` | `./data/tgii.db` | SQLite database path |
