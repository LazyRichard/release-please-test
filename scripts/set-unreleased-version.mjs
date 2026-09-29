import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const next = process.argv[2];
if (!/^\d+\.\d+\.0$/.test(next ?? '')) {
  throw new Error('Usage: node scripts/set-unreleased-version.mjs X.Y.0');
}

const manifestPath = new URL('../.release-please-manifest.json', import.meta.url);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const current = manifest['.'];
assert.match(current, /^\d+\.\d+\.\d+$/);
assert.notEqual(next, current, 'new version must differ from current manifest version');

for (const path of ['../pom.xml', '../module-a/pom.xml']) {
  const file = new URL(path, import.meta.url);
  const source = readFileSync(file, 'utf8');
  const oldVersion = `<version>${current}</version>`;
  assert.equal(source.split(oldVersion).length, 2, `${path}: expected one ${oldVersion}`);
  writeFileSync(file, source.replace(oldVersion, `<version>${next}</version>`));
}

manifest['.'] = next;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Changed Maven POMs and manifest from ${current} to ${next}; no tag created.`);
