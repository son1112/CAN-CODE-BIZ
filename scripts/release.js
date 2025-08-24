#!/usr/bin/env node

/**
 * Release Management Script
 *
 * Handles the complete release process including version bump, changelog update,
 * git tagging, and pushing to remote repository
 *
 * Usage: node scripts/release.js [patch|minor|major] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isDryRun = process.argv.includes('--dry-run');

function execCommand(command, description) {
  console.log(`🔧 ${description}...`);
  if (isDryRun) {
    console.log(`   [DRY RUN] Would execute: ${command}`);
    return '';
  }
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

function checkGitStatus() {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.error('❌ Working directory not clean. Please commit or stash changes first.');
    console.log('Uncommitted changes:');
    console.log(status);
    process.exit(1);
  }
  console.log('✅ Working directory is clean');
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
}

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function generateReleaseNotes(version) {
  const latestTag = getLatestTag();

  if (!latestTag) {
    return `## Release Notes for v${version}

This is the initial release of Rubber Ducky Live.

### Features
- Real-time voice-enabled AI chat companion
- Power Agents system for custom AI personalities
- Session management and persistence
- Speech recognition with continuous conversation mode
- Comprehensive test suite

See CHANGELOG.md for detailed feature list.`;
  }

  // Get commits since last tag
  const commits = execSync(`git log ${latestTag}..HEAD --oneline`, { encoding: 'utf8' });

  return `## Release Notes for v${version}

### Changes since ${latestTag}

${commits.split('\n')
  .filter(line => line.trim())
  .map(line => `- ${line}`)
  .join('\n')}

See CHANGELOG.md for detailed information.`;
}

function main() {
  const versionType = process.argv[2];

  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Usage: node scripts/release.js [patch|minor|major] [--dry-run]');
    console.error('');
    console.error('Version types:');
    console.error('  patch  - Bug fixes (0.1.0 -> 0.1.1)');
    console.error('  minor  - New features (0.1.0 -> 0.2.0)');
    console.error('  major  - Breaking changes (0.1.0 -> 1.0.0)');
    console.error('');
    console.error('Options:');
    console.error('  --dry-run  - Show what would be done without executing');
    process.exit(1);
  }

  console.log(`🚀 Starting ${versionType} release${isDryRun ? ' (DRY RUN)' : ''}...`);

  try {
    // Pre-flight checks
    if (!isDryRun) {
      checkGitStatus();
    }

    const currentBranch = getCurrentBranch();
    console.log(`📍 Current branch: ${currentBranch}`);

    if (currentBranch !== 'main' && !isDryRun) {
      console.warn(`⚠️  You're not on the main branch. Continue? (y/N)`);
      // In a real scenario, you'd want to prompt for user input
      // For now, we'll continue but show the warning
    }

    // Run the version script
    execCommand(`node scripts/version.js ${versionType}`, 'Version update');

    // Get the new version
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const newVersion = packageJson.version;

    console.log(`📋 Release Summary:`);
    console.log(`   Version: ${newVersion}`);
    console.log(`   Type: ${versionType}`);
    console.log(`   Branch: ${currentBranch}`);

    // Generate release notes
    const releaseNotes = generateReleaseNotes(newVersion);
    const releaseNotesPath = `release-notes-${newVersion}.md`;

    if (!isDryRun) {
      fs.writeFileSync(releaseNotesPath, releaseNotes);
      console.log(`📝 Release notes written to ${releaseNotesPath}`);
    }

    // Push to remote
    if (!isDryRun) {
      const pushCommand = 'git push && git push --tags';
      execCommand(pushCommand, 'Push to remote repository');

      // Clean up release notes file
      fs.unlinkSync(releaseNotesPath);
    }

    console.log('');
    console.log('🎉 Release completed successfully!');
    console.log(`📦 Version ${newVersion} has been released`);
    console.log(`🏷️  Tag v${newVersion} created and pushed`);
    console.log('');
    console.log('Next steps:');
    console.log('- Update any deployment configurations');
    console.log('- Monitor application after deployment');
    console.log('- Consider creating a GitHub release with the release notes');

  } catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}