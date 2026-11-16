const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../lib/catalog.json');
test('catalog IDs are unique and source, control and documentation paths exist', () => {
  assert.equal(new Set(catalog.map((entry) => entry.id)).size, catalog.length);
  for (const entry of catalog) {
    for (const file of [entry.source, entry.safeControl, entry.documentation].filter(Boolean)) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', file)), `${entry.id}: ${file}`);
    }
    assert.equal(entry.expectedFinding, entry.status === 'active');
  }
});
