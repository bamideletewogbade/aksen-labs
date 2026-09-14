const fields = new Set([
  'requestId',
  'operationId',
  'route',
  'method',
  'status',
  'durationMs',
  'model',
  'routing',
  'profile',
  'providerRequestId',
  'promptTokens',
  'completionTokens',
  'costMicros',
  'errorCode',
  'stage',
  'logStatus',
]);
export function safeLogDetails(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(
        ([key, value]) =>
          fields.has(key) &&
          (typeof value === 'string' ||
            (typeof value === 'number' && Number.isFinite(value)) ||
            typeof value === 'boolean'),
      )
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? value.slice(0, 240) : value,
      ]),
  );
}
export function errorCode(error: unknown) {
  if (error instanceof SyntaxError) return 'invalid_json';
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  if (error instanceof Error && /not configured/.test(error.message))
    return 'configuration_missing';
  if (error instanceof Error && /truncated/.test(error.message))
    return 'output_truncated';
  if (error instanceof Error && /empty|JSON object/.test(error.message))
    return 'invalid_output';
  if (error instanceof Error && /completion failed: (\d+)/.test(error.message))
    return `provider_http_${error.message.match(/completion failed: (\d+)/)?.[1]}`;
  return 'operation_failed';
}
