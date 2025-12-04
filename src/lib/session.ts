import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData extends IronSessionData {
  user_id?: string;
  brand_id?: string;
  branch_id?: string;
  role?: string;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'vetconnect-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}
