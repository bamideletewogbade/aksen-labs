import { adminEmailAllowed } from './admin-policy';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function workspaceUser() {
  const user = await getChatGPTUser();
  if (!user) throw new Error('Sign in required.');
  if (!adminEmailAllowed(user.email))
    throw new Error('Workspace access is not configured for this account.');
  return user;
}
