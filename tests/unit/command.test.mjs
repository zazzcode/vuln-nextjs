import { test, expect } from 'vitest';
import unsafeExec from '../../pages/api/vulnerable-exec.js';
import secureCommand from '../../pages/api/secure/command.js';
import { request } from './helpers.mjs';

test('OS-001: unsafe endpoint executes a shell command string', async () => {
  const result = await request(unsafeExec, { body: { command: 'printf zazzles-command-marker' } });
  expect(result.status).toBe(200);
  expect(result.data.output).toBe('zazzles-command-marker');
});

test('OS-001: semicolons reach a shell, so one request runs two commands', async () => {
  const result = await request(unsafeExec, { body: { command: 'printf zazzles-one; printf zazzles-two' } });
  expect(result.data.output).toBe('zazzles-onezazzles-two');
});

test('safe control: the same metacharacter string is echoed as inert data', async () => {
  const attack = 'printf zazzles-one; printf zazzles-two';
  const result = await request(secureCommand, { body: { text: attack } });
  expect(result.status).toBe(200);
  expect(result.data.echoed).toBe(attack);
});

test('safe control: substitutions and pipes stay literal', async () => {
  const attack = 'hello $(whoami) `id` | rm -rf / && echo pwned';
  const result = await request(secureCommand, { body: { text: attack } });
  expect(result.status).toBe(200);
  expect(result.data.echoed).toBe(attack);
});

test('safe control: rejects wrong methods, missing and oversized text', async () => {
  expect((await request(secureCommand, { method: 'GET' })).status).toBe(405);
  expect((await request(secureCommand, { body: {} })).status).toBe(400);
  expect((await request(secureCommand, { body: { text: 'x'.repeat(201) } })).status).toBe(400);
  expect((await request(secureCommand, { body: { text: ['array'] } })).status).toBe(400);
});
