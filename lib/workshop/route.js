import http from '../http.cjs';

export const get = (run) => http.endpoint(['GET'], run);
export const post = (run) => http.endpoint(['POST'], run);
export const problem = (res, status, error) => res.status(status).json({ error });
export const person = (res, found) => (found
  ? res.status(200).json({ person: { login: found.login, role: found.role, email: found.email } })
  : res.status(401).json({ person: null }));
