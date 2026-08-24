import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { JWT_SECRET } from '../config.js';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ ok: false, message: '未授权' }, 401);
  }
  try {
    await verify(auth.slice(7), JWT_SECRET, 'HS256');
    await next();
  } catch {
    return c.json({ ok: false, message: 'Token 已过期，请重新登录' }, 401);
  }
};
