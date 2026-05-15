require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const likesRoutes = require('./routes/likes');
const commentsRoutes = require('./routes/comments');
const sportsRoutes = require('./routes/sports');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
      : true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Attach req.user when a valid JWT is present; never rejects.
app.use(authenticateToken);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/posts', likesRoutes);
app.use('/api/posts', commentsRoutes);
app.use('/api/sports', sportsRoutes);

// Serve the built React app in production.
// __dirname here is .../server/src, so client/dist sits two levels up.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so React Router can handle it.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 + error handlers
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 10 MB)' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`SportsTalk API listening on http://localhost:${PORT}`);
});
