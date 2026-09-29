import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('.release-please-manifest.json'));
const policies = new Map([
  ['config/release-main-minor.json', 'always-bump-minor'],
  ['config/release-main-major.json', 'always-bump-major'],
  ['config/release-branch-patch.json', 'always-bump-patch'],
]);

for (const [path, versioning] of policies) {
  const config = JSON.parse(read(path));
  assert.equal(config['release-type'], 'maven', `${path}: release-type`);
  assert.equal(config.versioning, versioning, `${path}: versioning`);
  assert.deepEqual(config.packages, { '.': {} }, `${path}: packages`);
  assert.equal(config['skip-snapshot'], false, `${path}: skip-snapshot`);
}

const rootPom = read('pom.xml');
const childPom = read('module-a/pom.xml');
const rootVersion = rootPom.match(/<artifactId>release-please-test<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1];
const childParentVersion = childPom.match(/<artifactId>release-please-test<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1];
assert.ok(rootVersion, 'root Maven version is missing');
assert.equal(childParentVersion, rootVersion, 'module parent version differs from root');
assert.match(manifest['.'], /^\d+\.\d+\.\d+$/, 'manifest version');
assert.match(rootVersion, /^\d+\.\d+\.\d+(?:-SNAPSHOT)?$/, 'Maven version');

const workflow = read('.github/workflows/release-please.yml');
for (const path of policies.keys()) assert.ok(workflow.includes(path), `${path} is not selected by the Action`);
assert.ok(workflow.includes('target-branch: ${{ github.ref_name }}'), 'target branch is not explicit');

console.log(`Fixture is consistent: manifest=${manifest['.']}, pom=${rootVersion}`);
