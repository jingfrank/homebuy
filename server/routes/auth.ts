import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { JWT_SECRET, APP_PASSWORD } from '../config.js';

const app = new Hono();

// POST /api/auth/login
app.post('/login', async (c) => {
  const body = await c.req.json() as { password: string };
  if (body.password !== APP_PASSWORD) {
    return c.json({ ok: false, message: '密码错误' }, 401);
  }
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: 'user', iat: now, exp: now + 60 * 60 * 24 * 30 },
    JWT_SECRET,
    'HS256'
  );
  return c.json({ ok: true, token });
});

// GET /api/auth/verify
app.get('/verify', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ ok: false }, 401);
  }
  try {
    await verify(auth.slice(7), JWT_SECRET, 'HS256');
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 401);
  }
});

export default app;
