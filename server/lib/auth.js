const crypto = require('crypto');

/*
 * Single-admin auth. The password lives in the ADMIN_PASSWORD env var; a
 * successful login returns a short-lived signed token (HMAC-SHA256). The
 * signing key is derived from the password (plus ADMIN_SECRET if set), so
 * changing the password instantly invalidates every issued token.
 */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest();

const isConfigured = () => Boolean(process.env.ADMIN_PASSWORD);
const signingKey = () => sha256(`portfolio-admin:${process.env.ADMIN_PASSWORD}:${process.env.ADMIN_SECRET || ''}`);
const sign = (payload) => crypto.createHmac('sha256', signingKey()).update(payload).digest();

// Compare digests so the comparison is constant-time regardless of length
const passwordMatches = (given) =>
  isConfigured() && crypto.timingSafeEqual(sha256(String(given || '')), sha256(process.env.ADMIN_PASSWORD));

const issueToken = () => {
  const payload = b64url(JSON.stringify({ sub: 'admin', exp: Date.now() + TOKEN_TTL_MS }));
  return { token: `${payload}.${b64url(sign(payload))}`, expiresAt: Date.now() + TOKEN_TTL_MS };
};

const verifyToken = (token) => {
  if (!isConfigured() || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
};

const requireAuth = (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ message: 'Not authorised' });
  next();
};

/*
 * Login throttle (in-memory): 5 failed attempts per IP per 15 minutes, plus a
 * global cap so rotating spoofed IPs can't brute-force the password either.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const MAX_GLOBAL_FAILS = 25;
const failures = new Map();
let globalFails = { count: 0, first: 0 };

const loginThrottle = (req, res, next) => {
  const now = Date.now();
  if (now - globalFails.first > WINDOW_MS) globalFails = { count: 0, first: now };
  if (globalFails.count >= MAX_GLOBAL_FAILS) {
    return res.status(429).json({ message: 'Login is temporarily locked. Try again later.' });
  }
  const entry = failures.get(req.ip);
  if (entry && now - entry.first > WINDOW_MS) failures.delete(req.ip);
  const current = failures.get(req.ip);
  if (current && current.count >= MAX_FAILS) {
    const retryIn = Math.ceil((WINDOW_MS - (now - current.first)) / 60000);
    return res.status(429).json({ message: `Too many attempts. Try again in ${retryIn} min.` });
  }
  next();
};

const recordFailure = (ip) => {
  globalFails.count += 1;
  const entry = failures.get(ip);
  if (entry) entry.count += 1;
  else failures.set(ip, { count: 1, first: Date.now() });
};

const clearFailures = (ip) => failures.delete(ip);

module.exports = { isConfigured, passwordMatches, issueToken, verifyToken, requireAuth, loginThrottle, recordFailure, clearFailures };
