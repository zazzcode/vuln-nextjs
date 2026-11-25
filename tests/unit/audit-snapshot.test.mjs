// A vulnerable dependency is a finding the SCA tools must report, so the audit
// snapshot may not lose an advisory unless it is retired by name. The decision
// lives in scripts/audit-snapshot.mjs; scripts/check-audit.mjs applies it when
// `pnpm audit:update` runs.
import { test, expect, describe } from 'vitest';
import { unretiredDrops } from '../../scripts/audit-snapshot.mjs';

const advisory = (title) => ({ module_name: 'next', vulnerable_versions: '<14.0.0', title });
const audit = (ids) => ({ advisories: Object.fromEntries(ids.map((id) => [id, advisory(`${id} title`)])) });

describe('audit snapshot', () => {
  test('a newly published advisory is gained, never counted as lost', () => {
    expect(unretiredDrops(audit(['GHSA-a', 'GHSA-b']), audit(['GHSA-a', 'GHSA-b', 'GHSA-new']))).toEqual([]);
  });

  test('an advisory that is no longer reported is named, with what it was', () => {
    expect(unretiredDrops(audit(['GHSA-a', 'GHSA-b']), audit(['GHSA-b'])))
      .toEqual([{ id: 'GHSA-a', ...advisory('GHSA-a title') }]);
  });

  test('an advisory retired by name may go', () => {
    expect(unretiredDrops(audit(['GHSA-a', 'GHSA-b']), audit(['GHSA-b']), ['GHSA-a'])).toEqual([]);
  });

  test('retiring one advisory does not cover another', () => {
    expect(unretiredDrops(audit(['GHSA-a', 'GHSA-b']), audit([]), ['GHSA-a']).map(({ id }) => id)).toEqual(['GHSA-b']);
  });

  test('an audit that returned nothing loses every advisory', () => {
    expect(unretiredDrops(audit(['GHSA-a', 'GHSA-b']), { advisories: {} })).toHaveLength(2);
    expect(unretiredDrops(audit(['GHSA-a']), {})).toHaveLength(1);
    expect(unretiredDrops(audit(['GHSA-a']), null)).toHaveLength(1);
  });
});
