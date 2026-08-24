import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initDb } from './db.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import communityRoutes from './routes/communities.js';
import listingRoutes from './routes/listings.js';
import notesRoutes from './routes/notes.js';

// Initialize database
initDb();

const app = new Hono();

// CORS for development
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://111.229.187.142'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Auth routes (no auth required)
app.route('/api/auth', authRoutes);

// Protected API routes
app.use('/api/*', requireAuth);
app.route('/api/communities', communityRoutes);
app.route('/api/listings', listingRoutes);
app.route('/api/notes', notesRoutes);

// Health check
app.get('/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

const PORT = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
