import { getDb } from '@/db';
import { conversations } from '@/db/schema';

export async function saveConversationTurn(input: {
  id: string;
  channel?: string;
  summary: string;
  handoffReason?: string | null;
  urgency?: string;
}): Promise<void> {
  try {
    const db = getDb();
    const channel = input.channel || 'web';
    const urgency = input.urgency || 'normal';
    const handoffReason = input.handoffReason ?? null;
    await db.insert(conversations)
      .values({ id: input.id, channel, summary: input.summary, handoffReason, urgency })
      .onConflictDoUpdate({
        target: conversations.id,
        // A new visitor message always reopens the thread, even if a person had
        // previously marked it resolved - fresh activity means it needs a look again.
        set: { summary: input.summary, handoffReason, urgency, status: 'open', updatedAt: new Date() },
      });
  } catch {
    // Conversation logging is best-effort and must never break the actual chat reply.
  }
}
