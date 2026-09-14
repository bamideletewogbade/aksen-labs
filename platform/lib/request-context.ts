import { AsyncLocalStorage } from 'node:async_hooks';
export type RequestContext = {
  requestId: string;
  route: string;
  method: string;
};
export const requestContext = new AsyncLocalStorage<RequestContext>();
