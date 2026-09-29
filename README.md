# Release Please Maven branch-policy test

This is a standalone GitHub repository fixture for testing this policy:

| Branch | Release policy | Example |
| --- | --- | --- |
| `main` | Minor by default; major when selected | `1.2.0 → 1.3.0` or `1.2.0 → 2.0.0` |
| `release/*` | Patch only | `1.3.0 → 1.3.1 → 1.3.2` |

All three configs use Release Please's `maven` strategy. The root and child `pom.xml` files let you inspect whether both Maven versions change. The Action chooses a config for the current branch. `RELEASE_PLEASE_MAIN_BUMP=major` (a GitHub repository variable) changes the main policy to major; otherwise it is minor. A manual run on main can also select major or minor. Release branches always select patch, even when a manual run supplies major.

## Local checks

Run `node scripts/check-setup.mjs`. If Maven is installed, also run `mvn -q validate`. These check the fixture; they do **not** run Release Please or test GitHub behavior.

## Publish the fixture to a GitHub test repository

This directory is initialized with an initial `main` commit and `v1.2.0` tag. Create an empty GitHub repository, then run:

```bash
git remote add origin git@github.com:OWNER/REPO.git
git push -u origin main
git push origin v1.2.0
```

Enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. The workflow uses `GITHUB_TOKEN` by default. For Action-created PRs and tags to trigger other workflows, create a repository secret named `RELEASE_PLEASE_TOKEN` with repository Contents and Pull requests write permission. Do not commit a token. The `main` branch should be the repository default branch.

## Test minor on main, then patch on a release branch

1. Push a releasable commit to main:

   ```bash
   git commit --allow-empty -m "fix: exercise main minor release"
   git push origin main
   ```

2. The Action should open a release PR proposing `1.3.0` despite the `fix:` commit. Inspect the root and child POM changes. Merge it and wait for tag `v1.3.0` and the GitHub Release.
3. Release Please's Maven strategy proposes the **next SNAPSHOT in a separate PR**. Record that PR and its proposed POM version. You can leave it open while cutting the release branch.
4. Create the release branch from the **tagged release commit**, then push a fix:

   ```bash
   git switch -c release/1.3 v1.3.0
   git push -u origin release/1.3
   git commit --allow-empty -m "fix: exercise release branch patch"
   git push origin release/1.3
   ```

5. The Action should propose `1.3.1` on `release/1.3`. Merge the PR and check tag `v1.3.1`, the GitHub Release, and the branch's next SNAPSHOT PR.

The branch starts at `v1.3.0`, before the main SNAPSHOT PR is merged.

## Test the untagged branch point separately

Use a **fresh copy** of the initial fixture, with only the `v1.2.0` seed tag. This experiment tests the narrower requirement: main's version has advanced but `1.3.0` has **not** been released or tagged.

```bash
node scripts/set-unreleased-version.mjs 1.3.0
node scripts/check-setup.mjs
git add pom.xml module-a/pom.xml .release-please-manifest.json
git commit -m "chore: set 1.3.0 before release"
git push origin main
git switch -c release/1.3-untagged
git push -u origin release/1.3-untagged
git commit --allow-empty -m "fix: test patch from untagged branch point"
git push origin release/1.3-untagged
```

Record whether Release Please opens a release PR, the proposed version, any errors, and whether it creates a release tag only after merging that PR. Compare this result with the tagged-branch test above. Do not treat a PR for `1.3.1` alone as proof that Release Please *enforces* the branch-point rule; also inspect what happens when main later publishes `1.3.0` or another version.

## Test major on main

On a fresh copy of this fixture, set GitHub repository variable `RELEASE_PLEASE_MAIN_BUMP` to `major` before pushing a `fix:` commit. The proposed release should be `2.0.0`. A manual workflow run with `main_bump=major` selects the same config, but still needs a releasable commit since the last release. Do this in a fresh repository to keep the minor and major experiments independent.

## Test without Conventional Commits

On another fresh copy, push an ordinary message such as `update code` and record whether any release PR appears. Then try a commit with the `Release-As: 1.3.0` footer and compare. This checks the separate question of what triggers Release Please to propose a release; `always-bump-minor` controls the version selected **after** it decides there is a release candidate.

## What this fixture can establish

It tests `maven` plus distinct main/release-branch version policies and shows the actual PR, tag, and SNAPSHOT behavior. Branch creation remains a Git operation outside Release Please. The separate untagged experiment checks whether a patch line can start from an unreleased version bump on main.

Sources: [Maven strategy](https://github.com/googleapis/release-please/blob/main/docs/java.md), [versioning policies](https://github.com/googleapis/release-please/blob/main/docs/customizing.md), [multiple target branches](https://github.com/googleapis/release-please-action).
