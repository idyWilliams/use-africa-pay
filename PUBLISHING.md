# Publishing Guide

This guide explains how to publish the `@use-africa-pay/core` package to npm.

## Prerequisites

1.  **NPM Account**: Ensure you have an account on [npmjs.com](https://www.npmjs.com/).
2.  **Login**: Login to npm in your terminal:
    ```bash
    npm login
    # Follow the prompts to authenticate
    ```

## Manual Publishing

### 1. Build the Project

Ensure the project is built and free of errors:

```bash
pnpm build
```

### 2. Update Version

Update the version number in `packages/core/package.json`. You should follow [Semantic Versioning](https://semver.org/):

-   **Patch** (0.0.x): Bug fixes
-   **Minor** (0.x.0): New features (backward compatible)
-   **Major** (x.0.0): Breaking changes

```bash
# Example: Bump version manually in package.json
# "version": "0.0.2"
```

### 3. Publish

Navigate to the core package directory and publish:

```bash
cd packages/core
pnpm publish --access public --no-git-checks
```

> **Note**: `--access public` is required for scoped packages (like `@use-africa-pay/core`) unless you have a paid npm organization.
> **Note**: `--no-git-checks` might be needed if you haven't committed changes yet, but it's recommended to commit first.

## Automating with GitHub Actions

**Automation is now set up!**

To publish a new version automatically:

1.  **Update Version**: Bump the version in `packages/core/package.json` (e.g., to `0.0.2`) and commit it.
    ```bash
    git add .
    git commit -m "chore: bump version to 0.0.2"
    git push origin main
    ```
2.  **Create a Release**:
    -   Go to your GitHub repository.
    -   Click "Releases" -> "Draft a new release".
    -   Tag version: `v0.0.2` (should match your package.json version).
    -   Title: `v0.0.2`
    -   Click **Publish release**.

The GitHub Action will automatically build and publish your package to npm! 🚀
