// Invoke a Next.js API handler directly with minimal req/res doubles.
// Resolves only when the handler sends a JSON response, so callback-style
// handlers (for example child_process.exec) are awaited correctly.
export function request(handler, { method = 'POST', body = {}, query = {}, cookies = {}, headers: requestHeaders = {}, url = '' } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    let status, data, done = false;
    const res = {
      setHeader(name, value) { headers[name] = value; },
      status(value) { status = value; return res; },
      json(value) {
        data = JSON.parse(JSON.stringify(value));
        if (!done) { done = true; resolve({ status, data, headers }); }
      },
    };
    Promise.resolve(handler({ method, body, query, cookies, headers: requestHeaders, url }, res)).catch((error) => {
      if (!done) { done = true; reject(error); }
    });
  });
}
