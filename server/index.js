require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB, isDbReady, requireDb } = require('./config/db');

const app = express();

// Render terminates TLS in front of us; trust its proxy hop for req.ip
app.set('trust proxy', 1);

// Connect to MongoDB (never exits the process on failure)
connectDB();

// Allowed browser origins, comma-separated. The live site calls the API through
// Vercel's same-origin /api rewrite, so this mainly matters for local dev.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.disable('x-powered-by');
// Security headers; media is public, so let other origins embed it
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '200kb' }));

// Health check — reports the database state instead of crashing with it
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Portfolio API is running', database: isDbReady() ? 'connected' : 'unavailable' });
});

// Routes
app.use('/api/content', requireDb, require('./routes/content'));
app.use('/api/media', requireDb, require('./routes/media'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', requireDb, require('./routes/projects'));
app.use('/api/skills', requireDb, require('./routes/skills'));
app.use('/api/contact', requireDb, require('./routes/contact'));

// JSON for unknown API routes and for errors (e.g. malformed or oversized bodies)
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
// (Express recognises error handlers by their four arguments)
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
