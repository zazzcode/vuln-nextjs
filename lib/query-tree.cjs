// Nested query parameters, as `qs` reads them: a[b]=1 gives { a: { b: '1' } }
// and a repeated parameter gives an array. Next.js itself keeps req.query flat.
function parseQuery(url = '') {
  const tree = {};
  const search = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  for (const [name, value] of new URLSearchParams(search)) {
    const path = name.split('[').map((part) => part.replace(/\]$/, ''));
    if (path.includes('__proto__') || path.includes('constructor')) continue;
    let node = tree;
    for (const part of path.slice(0, -1)) {
      if (!Object.hasOwn(node, part) || typeof node[part] !== 'object') node[part] = {};
      node = node[part];
    }
    const last = path[path.length - 1];
    if (Object.hasOwn(node, last)) node[last] = [].concat(node[last], value);
    else node[last] = value;
  }
  return tree;
}

module.exports = { parseQuery };
