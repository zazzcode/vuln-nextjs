function pruneKeys(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([key]) => !key.startsWith('$')));
}

function pruneTree(value) {
  if (Array.isArray(value)) return value.map(pruneTree);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !key.startsWith('$'))
    .map(([key, child]) => [key, pruneTree(child)]));
}

module.exports = { pruneKeys, pruneTree };
