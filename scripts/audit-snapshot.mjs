// The decision part of scripts/check-audit.mjs, kept apart from the audit run
// so that it can be tested.
//
// Every advisory in the committed snapshot is a finding the SCA tools must
// report, so a new snapshot may not silently lose one: that is a vulnerability
// fixed, or an audit that returned nothing. It may lose one only when that
// advisory is retired by name.
export function unretiredDrops(previous, next, retired = []) {
  const before = previous?.advisories ?? {};
  const after = next?.advisories ?? {};
  return Object.keys(before)
    .filter((id) => !Object.hasOwn(after, id) && !retired.includes(id))
    .map((id) => ({ id, ...before[id] }));
}
