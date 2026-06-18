# Release Checklist

Release automation is handled by Release Please and GitHub Actions Trusted Publishing.

## Before Release

- Confirm the target version is not already published:

```bash
version="$(node -p "require('./package.json').version")"
npm view "form-father@$version" version
```

- Run the full release gate:

```bash
npm run release:check
```

- Review the tarball contents from `npm run pack:dry-run`.
- Review `CHANGELOG.md` and make sure the release date and version are correct.
- Make sure there are no unexpected files in `git status`.

## Publish

Normal publish path:

1. Merge the Release Please pull request.
2. Open the `Release Please` workflow run.
3. Approve the `npm` environment deployment when GitHub asks for review.
4. The workflow publishes `form-father` with npm provenance through Trusted Publishing.

Trusted Publisher settings on npm:

- Publisher: `GitHub Actions`
- Organization or user: `Poliklot`
- Repository: `form-father`
- Workflow filename: `release-please.yml`
- Environment name: `npm`

## After Publish

- Verify npm metadata:

```bash
version="$(node -p "require('./package.json').version")"
npm view "form-father@$version" version
npm view "form-father@$version" dist.tarball
npm view "form-father@$version" provenance
```

- Smoke install in a temporary folder:

```bash
version="$(node -p "require('./package.json').version")"
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npm init -y
npm install "form-father@$version"
node -e "import('form-father').then(m => console.log(typeof m.default, typeof m.isUrlValid))"
```
