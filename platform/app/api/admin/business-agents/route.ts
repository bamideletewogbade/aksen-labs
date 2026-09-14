import {
  runBusinessAgent,
  savedBusinessDrafts,
} from '@/lib/agent-workbench-runtime';
import { withRequestLog } from '@/lib/request-log';
export const POST = withRequestLog(
  '/api/admin/business-agents',
  (request: Request) => runBusinessAgent(request, true),
);
export const GET = withRequestLog(
  '/api/admin/business-agents',
  savedBusinessDrafts,
);
