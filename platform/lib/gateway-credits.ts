/** Read-only account balance. Never return provider responses or credentials. */
export async function gatewayCredits(): Promise<
  | { status: 'available'; balance: number; totalUsed: number }
  | { status: 'unavailable' | 'not-configured' }
> {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return { status: 'not-configured' };
  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { status: 'unavailable' };
    const body = (await response.json()) as Record<string, unknown>;
    const amount = (value: unknown) =>
      typeof value === 'number' || (typeof value === 'string' && value.trim())
        ? Number(value)
        : NaN;
    const balance = amount(body.balance);
    const totalUsed = amount(body.total_used);
    if (
      !Number.isFinite(balance) ||
      !Number.isFinite(totalUsed) ||
      totalUsed < 0
    )
      return { status: 'unavailable' };
    return { status: 'available', balance, totalUsed };
  } catch {
    return { status: 'unavailable' };
  }
}
