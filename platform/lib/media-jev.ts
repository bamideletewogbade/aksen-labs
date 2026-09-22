import type { InspirationAngle } from './media-inspiration';

export const JEV_PROMPT_VERSION = 'media-angle-v2';
export type AngleId = InspirationAngle['id'];
export type JevChoice = AngleId | 'none';
export type JevAnswer = { choice: JevChoice; confidence: number | null; probabilities: Partial<Record<JevChoice, number>> };
export type JevAnswers = { founderFit?: JevAnswer; practicalExample?: JevAnswer };
export type JevOutcome = { editorialQuality?: number; published?: boolean; views?: number; averageWatchSeconds?: number; notes?: string };

const choices: JevChoice[] = ['angle_1', 'angle_2', 'angle_3', 'none'];
const criterion = { angle_1: 'The first concept', angle_2: 'The second concept', angle_3: 'The third concept', none: 'None is sufficiently supported by the supplied state' };

export function jevQuestions() {
  return {
    founder_fit: {
      type: 'choice',
      instructions: 'Which concept most directly reflects the founder ownTake? Judge only the supplied words. Choose none if no concept clearly reflects it.',
      criteria: {
        angle_1: criterion.angle_1 + ' most directly reflects ownTake', angle_2: criterion.angle_2 + ' most directly reflects ownTake',
        angle_3: criterion.angle_3 + ' most directly reflects ownTake', none: criterion.none,
      },
    },
    practical_example: {
      type: 'choice',
      instructions: 'Which concept includes the clearest concrete business action a viewer could try? Judge only the supplied words. Choose none if none offers a concrete action.',
      criteria: {
        angle_1: criterion.angle_1 + ' has the clearest concrete action', angle_2: criterion.angle_2 + ' has the clearest concrete action',
        angle_3: criterion.angle_3 + ' has the clearest concrete action', none: criterion.none,
      },
    },
  } as const;
}

function answer(value: unknown): JevAnswer | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!choices.includes(raw.choice as JevChoice)) return null;
  const probabilities: JevAnswer['probabilities'] = {};
  const supplied = raw.probabilities && typeof raw.probabilities === 'object' && !Array.isArray(raw.probabilities) ? raw.probabilities as Record<string, unknown> : {};
  for (const key of choices) if (typeof supplied[key] === 'number' && Number.isFinite(supplied[key]) && supplied[key] >= 0 && supplied[key] <= 1) probabilities[key] = supplied[key];
  const confidence = typeof raw.confidence === 'number' && Number.isFinite(raw.confidence) && raw.confidence >= 0 && raw.confidence <= 1 ? raw.confidence : null;
  return { choice: raw.choice as JevChoice, confidence, probabilities };
}

export function parseJevResult(value: unknown): { model: string; answers: JevAnswers; suggestion: AngleId | null; inputTokens: number | null; outputTokens: number | null; costMicros: number | null } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const answers = raw.answers && typeof raw.answers === 'object' && !Array.isArray(raw.answers) ? raw.answers as Record<string, unknown> : {};
  const founderFit = answer(answers.founder_fit);
  const practicalExample = answer(answers.practical_example);
  if (!founderFit || !practicalExample) return null;
  const usage = raw.usage && typeof raw.usage === 'object' && !Array.isArray(raw.usage) ? raw.usage as Record<string, unknown> : {};
  const token = (candidate: unknown) => typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate >= 0 ? candidate : null;
  const suggestion = founderFit.choice !== 'none' && founderFit.choice === practicalExample.choice ? founderFit.choice : null;
  const cost = typeof usage.cost === 'number' && Number.isFinite(usage.cost) && usage.cost >= 0 ? Math.round(usage.cost * 1_000_000) : null;
  return { model: typeof raw.model === 'string' ? raw.model.slice(0, 80) : '', answers: { founderFit, practicalExample }, suggestion, inputTokens: token(usage.input_tokens), outputTokens: token(usage.output_tokens), costMicros: cost };
}

export function cleanJevOutcome(value: unknown): JevOutcome | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const result: JevOutcome = {};
  if (raw.editorialQuality != null) {
    if (!Number.isInteger(raw.editorialQuality) || (raw.editorialQuality as number) < 1 || (raw.editorialQuality as number) > 5) return null;
    result.editorialQuality = raw.editorialQuality as number;
  }
  if (raw.published != null) {
    if (typeof raw.published !== 'boolean') return null;
    result.published = raw.published;
  }
  if (raw.views != null) {
    if (!Number.isSafeInteger(raw.views) || (raw.views as number) < 0) return null;
    result.views = raw.views as number;
  }
  if (raw.averageWatchSeconds != null) {
    if (typeof raw.averageWatchSeconds !== 'number' || !Number.isFinite(raw.averageWatchSeconds) || raw.averageWatchSeconds < 0 || raw.averageWatchSeconds > 1800) return null;
    result.averageWatchSeconds = raw.averageWatchSeconds;
  }
  if (raw.notes != null) {
    if (typeof raw.notes !== 'string' || raw.notes.length > 500) return null;
    result.notes = raw.notes.trim();
  }
  return result;
}

export function jevSummary(rows: Array<{ status: string; suggestion: string | null; selectedAngle: string | null; outcome: unknown; inputTokens: number | null; outputTokens: number | null; latencyMs: number | null }>) {
  const evaluated = rows.filter((row) => row.status === 'shadow');
  const comparable = evaluated.filter((row) => row.suggestion && row.selectedAngle);
  const labeled = rows.filter((row) => !!cleanJevOutcome(row.outcome)?.editorialQuality);
  const total = (key: 'inputTokens' | 'outputTokens') => rows.reduce((sum, row) => sum + (row[key] || 0), 0);
  const quality = (matching: boolean) => {
    const group = comparable.filter((row) => (row.suggestion === row.selectedAngle) === matching)
      .map((row) => cleanJevOutcome(row.outcome)?.editorialQuality).filter((value): value is number => typeof value === 'number');
    return { count: group.length, average: group.length ? Math.round(group.reduce((sum, value) => sum + value, 0) / group.length * 10) / 10 : null };
  };
  return { attempts: rows.length, evaluated: evaluated.length, comparable: comparable.length,
    agreement: comparable.filter((row) => row.suggestion === row.selectedAngle).length,
    labeled: labeled.length, published: rows.filter((row) => cleanJevOutcome(row.outcome)?.published === true).length,
    inputTokens: total('inputTokens'), outputTokens: total('outputTokens'),
    averageLatencyMs: evaluated.length ? Math.round(evaluated.reduce((sum, row) => sum + (row.latencyMs || 0), 0) / evaluated.length) : null,
    qualityWhenAgreed: quality(true), qualityWhenDisagreed: quality(false) };
}
