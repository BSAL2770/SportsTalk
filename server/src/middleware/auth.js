const jwt = require('jsonwebtoken');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Attaches req.user if a valid token is present, but does NOT reject if missing.
function authenticateToken(req, _res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, username: payload.username };
  } catch {
    // Invalid token: treat as anonymous
  }
  next();
}

// Requires a valid token; 401 otherwise.
function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticateToken, requireAuth, signToken };
