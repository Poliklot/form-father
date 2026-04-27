# Release Checklist

Use this checklist for every npm release.

## Before Release

- Confirm `package.json` and `package/package.json` have the same version.
- Confirm the target version is not already published:

```bash
npm view form-father@0.6.0 version
```

- Run the full local release gate:

```bash
npm run release:check
```

- Review the tarball contents from `npm run pack:dry-run`.
- Review `CHANGELOG.md` and make sure the release date and version are correct.
- Make sure there are no unexpected files in `git status`.

## Publish

If npm cache permissions are broken locally, use the temporary cache prefix:

```bash
npm_config_cache=/tmp/form-father-npm-cache npm publish
```

If npm asks for 2FA:

```bash
npm_config_cache=/tmp/form-father-npm-cache npm publish --otp <code>
```

## After Publish

- Verify npm metadata:

```bash
npm view form-father@0.6.0 version
npm view form-father@0.6.0 dist.tarball
```

- Smoke install in a temporary folder:

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npm init -y
npm install form-father@0.6.0
node -e "import('form-father').then(m => console.log(typeof m.default, typeof m.isUrlValid))"
```

- Create a git tag:

```bash
git tag v0.6.0
git push origin v0.6.0
```
