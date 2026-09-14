import { runBusinessAgent } from '@/lib/agent-workbench-runtime';
import { withRequestLog } from '@/lib/request-log';
export const POST = withRequestLog('/api/business-agents', (request: Request) =>
  runBusinessAgent(request, false),
);
