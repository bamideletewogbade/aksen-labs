import { requestContext } from './request-context';
import { logBackendEvent } from './backend-events';
import { errorCode } from './log-policy';
export function withRequestLog<Args extends unknown[]>(
  route: string,
  handler: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    return requestContext.run(
      { requestId, route, method: request.method },
      async () => {
        const startSaved = await logBackendEvent('request.started');
        let response: Response;
        try {
          const origin = request.headers.get('origin');
          const adminWrite =
            route.startsWith('/api/admin/') &&
            !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
          if (
            adminWrite &&
            ((origin && origin !== new URL(request.url).origin) ||
              request.headers.get('sec-fetch-site') === 'cross-site')
          ) {
            response = Response.json(
              { error: 'Invalid request origin.' },
              { status: 403 },
            );
          } else {
            response = await handler(request, ...args);
          }
        } catch (error) {
          const status = error instanceof SyntaxError ? 400 : 500;
          await logBackendEvent('request.exception', {
            status,
            errorCode: errorCode(error),
            durationMs: Date.now() - started,
          });
          response = Response.json(
            {
              error:
                status === 400
                  ? 'A valid JSON request is required.'
                  : 'This action could not be completed. Please try again.',
              requestId,
            },
            { status },
          );
        }
        const finishSaved = await logBackendEvent(
          response.status >= 400 ? 'request.failed' : 'request.completed',
          { status: response.status, durationMs: Date.now() - started },
        );
        const headers = new Headers(response.headers);
        if (route.startsWith('/api/admin/'))
          headers.set('Cache-Control', 'private, no-store');
        headers.set('X-Request-ID', requestId);
        headers.set(
          'X-Log-Status',
          startSaved && finishSaved ? 'recorded' : 'degraded',
        );
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      },
    );
  };
}
