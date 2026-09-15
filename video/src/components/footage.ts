import manifest from '../footage-manifest.json';

/**
 * Whether a human-recorded clip is available to the edit.
 *
 * Reads the list scripts/scan-footage.mjs writes before every studio session and
 * every render. Named to read like the node call it stands in for, because that
 * is what a reader expects at the call site, but it is a lookup in a bundled
 * array: the browser this runs in has no filesystem.
 */
export function existsSync(name: string): boolean {
  return (manifest as string[]).includes(name);
}
