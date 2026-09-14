import { adminEmailAllowed } from '@/lib/admin-policy';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminSessionUser } from '@/lib/admin-session';

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_ID_HEADER = 'oai-authenticated-user-id';
const USER_EMAIL_HEADER = 'oai-authenticated-user-email';
const USER_FULL_NAME_HEADER = 'oai-authenticated-user-full-name';
const USER_FULL_NAME_ENCODING_HEADER =
  'oai-authenticated-user-full-name-encoding';
const PERCENT_ENCODED_UTF8 = 'percent-encoded-utf-8';
const SIGN_IN_PATH = '/signin-with-chatgpt';
const SIGN_OUT_PATH = '/signout-with-chatgpt';
const CALLBACK_PATH = '/callback';

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  if (process.env.ADMIN_PASSWORD_HASH)
    return adminSessionUser(requestHeaders.get('cookie'));
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!userId || !email) return null;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  return {
    // One person runs this workspace and can arrive two ways: ChatGPT sign-in,
    // which issues its own identifier, or the password fallback, whose session
    // stores ADMIN_OWNER_ID. Those produce different values, and every admin
    // query filters on owner_id, so records created under one route became
    // invisible under the other. When ADMIN_OWNER_ID is set it names the
    // workspace the data belongs to, however its owner signed in.
    //
    // This is a deliberate single-workspace choice. Who may enter is unchanged
    // and still decided by adminEmailAllowed; a second administrator added to
    // that allowlist would share this workspace rather than get their own.
    userId: workspaceOwnerId() || userId,
    displayName: fullName ?? email,
    email,
    fullName,
  };
}

/** The workspace records belong to, independent of how its owner signed in. */
export function workspaceOwnerId(): string {
  return process.env.ADMIN_OWNER_ID?.trim() || '';
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!adminEmailAllowed(user.email)) redirect('/');
  return user;
}

export function chatGPTSignInPath(returnTo: string): string {
  if (process.env.ADMIN_PASSWORD_HASH) return '/login';
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = '/'): string {
  if (process.env.ADMIN_PASSWORD_HASH) return '/logout';
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';

  let url: URL;
  try {
    url = new URL(value, 'https://app.local');
  } catch {
    return '/';
  }
  if (url.origin !== 'https://app.local') return '/';
  if (isReservedAuthPath(url.pathname)) return '/';

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
