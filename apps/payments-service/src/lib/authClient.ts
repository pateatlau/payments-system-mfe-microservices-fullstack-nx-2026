import { config } from '../config';
import { cache } from './cache';

export type MinimalUser = { id: string; email: string };

const ID_TTL = 30; // seconds

async function httpGet<T>(path: string): Promise<T> {
  const url = `${config.authService.url}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let message = `Auth request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      // Ignore JSON parse errors, use default message
    }
    throw new Error(message);
  }
  const data = await res.json();
  return (data?.data ?? data) as T;
}

export async function getUserByEmail(email: string): Promise<MinimalUser> {
  const key = `identity:email:${email}`;
  const cached = await cache.get<MinimalUser>(key);
  if (cached) return cached;

  const user = await httpGet<MinimalUser>(
    `/auth/internal/users/by-email?email=${encodeURIComponent(email)}`
  );
  await cache.set(key, user, { ttl: ID_TTL });
  await cache.set(`identity:id:${user.id}`, user, { ttl: ID_TTL });
  return user;
}

export async function getUserById(userId: string): Promise<MinimalUser> {
  const key = `identity:id:${userId}`;
  const cached = await cache.get<MinimalUser>(key);
  if (cached) return cached;

  const user = await httpGet<MinimalUser>(
    `/auth/internal/users/${encodeURIComponent(userId)}`
  );
  await cache.set(key, user, { ttl: ID_TTL });
  await cache.set(`identity:email:${user.email}`, user, { ttl: ID_TTL });
  return user;
}
