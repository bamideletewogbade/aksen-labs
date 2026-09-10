import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function workspaceUser() {
  const user = await getChatGPTUser();
  if (!user) throw new Error('Sign in required.');
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  // Local Sites development uses its provided seeded identity. Production fails closed.
  if ((!allowed.length && process.env.NODE_ENV !== 'development') || (allowed.length && !allowed.includes(user.email.toLowerCase()))) throw new Error('Workspace access is not configured for this account.');
  return user;
}
