/** Build a fake Request for calling route handlers directly. */
export function makeReq(opts: {
  method?: string;
  body?: unknown;
  form?: FormData;
  headers?: HeadersInit;
  url?: string;
}): Request {
  const init: RequestInit = { method: opts.method ?? "GET", headers: opts.headers };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "Content-Type": "application/json", ...(opts.headers ?? {}) };
  } else if (opts.form) {
    init.body = opts.form;
  }
  return new Request(opts.url ?? "http://localhost/test", init);
}

/** Wrap params in the Promise shape Next.js 15 route handlers expect. */
export function makeParams<T>(value: T): { params: Promise<T> } {
  return { params: Promise.resolve(value) };
}
