const mongoose = require('mongoose');

/*
 * Connect without ever killing the process. A failed connection used to call
 * process.exit(1), so one bad MONGO_URI made Render crash-loop (and email a
 * failure) on every visit. Now the API stays up and DB routes answer 503.
 */
const connectDB = async (attempt = 1) => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — database routes will return 503.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed (attempt ${attempt}): ${error.message}`);
    // Wrong username/password won't fix itself — don't hammer Atlas with retries
    if (/auth/i.test(error.message)) {
      console.error('Check the username/password in MONGO_URI. Not retrying.');
      return;
    }
    const delay = Math.min(60000, 2000 * 2 ** (attempt - 1));
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

const isDbReady = () => mongoose.connection.readyState === 1;

// While the database is down, fail fast instead of letting queries hang
const requireDb = (req, res, next) => {
  if (isDbReady()) return next();
  res.status(503).json({ message: 'Database unavailable' });
};

module.exports = { connectDB, isDbReady, requireDb };
