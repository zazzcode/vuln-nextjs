export function tidy(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('$')) continue;
    out[key] = tidy(child);
  }
  return out;
}

export const pick = (value, names) => Object.fromEntries(names.filter((name) => Object.hasOwn(value ?? {}, name)).map((name) => [name, String(value[name])]));

export const literal = (text) => String(text).replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&');
