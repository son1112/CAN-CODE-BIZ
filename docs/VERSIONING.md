# Versioning Guide

This document describes the versioning system and release process for Rubber Ducky Live.

## Overview

We follow [Semantic Versioning (SemVer)](https://semver.org/) and maintain a detailed [CHANGELOG.md](../CHANGELOG.md) following the [Keep a Changelog](https://keepachangelog.com/) format.

## Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes that require user intervention
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and small improvements

## Release Process

### Quick Commands

```bash
# Patch release (0.1.0 -> 0.1.1) - Bug fixes
npm run version:patch

# Minor release (0.1.0 -> 0.2.0) - New features
npm run version:minor

# Major release (0.1.0 -> 1.0.0) - Breaking changes
npm run version:major

# Test release process without making changes
npm run release:dry-run
```

### Manual Process

If you need more control over the release process:

```bash
# 1. Update CHANGELOG.md manually
# 2. Use the version script
node scripts/version.js patch|minor|major

# 3. Or use the full release script
node scripts/release.js patch|minor|major [--dry-run]
```

## What Happens During a Release

1. **Pre-flight checks**:
   - Lint code (`npm run lint`)
   - Build application (`npm run build`)
   - Verify working directory is clean

2. **Version update**:
   - Update `package.json` version
   - Update `CHANGELOG.md` with new version and date
   - Create git commit with version bump

3. **Git tagging**:
   - Create git tag `vX.Y.Z`
   - Push commits and tags to remote

4. **Documentation**:
   - Generate release notes
   - Update changelog links

## CHANGELOG.md Structure

The changelog follows this format:

```markdown
# Changelog

## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.0.0] - 2025-01-08
### Added
- New feature description

### Fixed
- Bug fix description
```

## When to Release

### Patch Releases (x.x.X)
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements
- Dependency updates (non-breaking)

### Minor Releases (x.X.0)
- New features
- API additions (backward compatible)
- New endpoints or functionality
- UI/UX improvements
- New configuration options

### Major Releases (X.0.0)
- Breaking API changes
- Removed functionality
- Changed behavior that affects existing users
- Major architectural changes
- Updated dependencies with breaking changes

## Git Tags and Releases

- Git tags follow the format `vX.Y.Z` (e.g., `v1.0.0`)
- Tags are automatically created and pushed during release
- Each tag represents a stable release point
- GitHub releases can be created from these tags

## Best Practices

### Before Releasing

1. **Test thoroughly**:
   ```bash
   npm test
   npm run test:e2e
   ```

2. **Update documentation**:
   - Update README.md if needed
   - Update API documentation
   - Review and update CHANGELOG.md

3. **Review changes**:
   ```bash
   git log --oneline [last-version]..HEAD
   ```

### During Development

1. **Update CHANGELOG.md** as you develop:
   - Add entries under `[Unreleased]`
   - Use proper categories (Added, Changed, Fixed, etc.)

2. **Follow commit message conventions**:
   ```
   feat: add new agent selection feature
   fix: resolve session restoration bug
   docs: update API documentation
   chore: update dependencies
   ```

3. **Use feature branches** for development:
   ```bash
   git checkout -b feature/new-chat-interface
   # ... development ...
   git checkout main
   git merge feature/new-chat-interface
   ```

## Automation Scripts

### `scripts/version.js`
- Handles version bumping
- Updates CHANGELOG.md
- Creates git commits and tags
- Validates build and lint

### `scripts/release.js`
- Complete release process
- Includes all version.js functionality
- Pushes to remote repository
- Generates release notes
- Supports dry-run mode

## Troubleshooting

### Release Failed
```bash
# Reset if release failed partway through
git reset --hard HEAD~1
git tag -d vX.Y.Z  # if tag was created
```

### Wrong Version Released
```bash
# Create a patch release to fix
npm run version:patch
```

### Need to Skip Pre-version Checks
```bash
# Edit package.json to temporarily remove preversion script
# Or fix the failing checks (preferred)
```

## Integration with CI/CD

The versioning system is designed to work with CI/CD pipelines:

1. **Automated Testing**: Tests run before version bump
2. **Build Verification**: Build succeeds before release
3. **Git Integration**: Tags trigger deployment pipelines
4. **Changelog**: Automated changelog updates

## Examples

### Example Patch Release
```bash
# Fix a bug in session management
npm run version:patch
# Creates v0.1.1, updates changelog, pushes to remote
```

### Example Minor Release
```bash
# Add new agent customization feature
npm run version:minor
# Creates v0.2.0, updates changelog, pushes to remote
```

### Example Dry Run
```bash
# Test the release process
npm run release:dry-run
# Shows what would happen without making changes
```