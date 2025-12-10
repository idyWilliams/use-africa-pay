# Changesets Workflow Guide

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Quick Start

### Adding a Changeset

When you make changes that should be released, create a changeset:

```bash
pnpm changeset
```

This will:
1. Ask which packages changed
2. Ask for the bump type (major, minor, patch)
3. Ask for a summary of changes
4. Create a markdown file in `.changeset/`

### Versioning Packages

When ready to release, update package versions and generate changelogs:

```bash
pnpm version
```

This will:
1. Consume all changesets in `.changeset/`
2. Update package versions
3. Update CHANGELOG.md files
4. Delete consumed changeset files

### Publishing to npm

Build and publish packages:

```bash
pnpm release
```

This will:
1. Build all packages
2. Publish to npm with the correct versions
3. Use the `public` access level

## Workflow Examples

### Example 1: Bug Fix

```bash
# Make your changes
git add .

# Create a changeset
pnpm changeset
# Select: @use-africa-pay/core
# Type: patch
# Summary: "Fixed phone number validation for Flutterwave"

# Commit the changeset
git commit -m "fix: phone number validation"
git push
```

### Example 2: New Feature

```bash
# Make your changes
git add .

# Create a changeset
pnpm changeset
# Select: @use-africa-pay/core
# Type: minor
# Summary: "Added support for recurring payments"

# Commit the changeset
git commit -m "feat: recurring payments support"
git push
```

### Example 3: Releasing

```bash
# Update versions
pnpm version

# Review the changes
git diff

# Commit version updates
git add .
git commit -m "chore: release v1.2.0"
git push

# Publish to npm
pnpm release
```

## Changeset Types

- **patch** (1.0.0 → 1.0.1): Bug fixes, documentation updates
- **minor** (1.0.0 → 1.1.0): New features, non-breaking changes
- **major** (1.0.0 → 2.0.0): Breaking changes

## Configuration

Changesets configuration is in `.changeset/config.json`:

```json
{
  "access": "public",        // Publish as public package
  "baseBranch": "main",      // Base branch for PRs
  "changelog": "@changesets/cli/changelog"  // Changelog format
}
```

## Scripts

Available in `package.json`:

- `pnpm changeset` - Create a new changeset
- `pnpm version` - Update versions from changesets
- `pnpm release` - Build and publish packages

## Best Practices

1. **Create changesets with your PRs**: Add a changeset for every PR that should trigger a release
2. **Write clear summaries**: Changelog entries come from changeset summaries
3. **Use semantic versioning**: Follow semver rules for version bumps
4. **Review before publishing**: Always run `--dry-run` first
5. **Commit changesets**: Changesets should be committed to version control

## CI/CD Integration

For automated releases with GitHub Actions, see Issue #28 in GITHUB_ISSUES.md.

## Troubleshooting

### "No changesets present"

Create a changeset first with `pnpm changeset`

### "Version already published"

Update the version in `package.json` or create a new changeset

### "Access denied"

Ensure you're logged in to npm: `npm login`

## Learn More

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
