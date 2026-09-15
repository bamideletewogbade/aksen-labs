import { existsSync } from 'node:fs';

/**
 * Finds the OpenRouter key without keeping a second copy of it.
 *
 * The platform already has one in its own .env, and a secret that lives in two
 * files is a secret that gets rotated in one of them. So this reads video/.env
 * if somebody made one, and otherwise borrows the platform's. Nothing is copied
 * and nothing is written.
 *
 * On a build machine there is no .env at all and the key arrives as a real
 * environment variable, which is why an already-set value always wins.
 */
const candidates = ['.env', '../platform/.env'];

export function loadEnv() {
  if (process.env.OPENROUTER_API_KEY) return 'environment';
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
    } catch {
      continue;
    }
    if (process.env.OPENROUTER_API_KEY) return file;
  }
  throw new Error(
    'No OPENROUTER_API_KEY found. Set it in the environment, or in video/.env, or leave platform/.env where it is.',
  );
}
