import { cookies } from 'next/headers';
import { verifyPassword, getUserByUsername } from './db';

const SESSION_COOKIE_NAME = 'pocketview_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(username: string) {
  const sessionData = {
    username,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);

    if (Date.now() > sessionData.expiresAt) {
      await destroySession();
      return null;
    }

    return { username: sessionData.username };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export function authenticate(username: string, password: string): boolean {
  return verifyPassword(username, password);
}
