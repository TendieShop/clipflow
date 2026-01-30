// Version management for ClipFlow
// Handles version checking, updates, and changelog

import { info, warn, logError } from './logger';

export interface VersionInfo {
  current: string;
  latest: string;
  url: string;
  publishedAt: string;
  changelog: string;
  isNewer: boolean;
}

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
}

// Parse version string to comparable array
function parseVersion(version: string): number[] {
  // Remove 'v' prefix if present
  const cleanVersion = version.replace(/^v/, '');
  // Split by dots and convert to numbers
  return cleanVersion.split('.').map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

// Compare two versions: returns 1 if a > b, -1 if a < b, 0 if equal
function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const numA = versionA[i] || 0;
    const numB = versionB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

export function isVersionNewer(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

export function formatVersionDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

export async function checkForUpdates(
  currentVersion: string,
  repoOwner: string = 'TendieShop',
  repoName: string = 'clipflow'
): Promise<VersionInfo> {
  info('version.checking', { current: currentVersion });

  try {
    // Fetch latest release from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release: Release = await response.json();
    const latestVersion = release.tag_name;

    const isNewer = isVersionNewer(currentVersion, latestVersion);

    const versionInfo: VersionInfo = {
      current: currentVersion,
      latest: latestVersion,
      url: release.html_url,
      publishedAt: release.published_at,
      changelog: release.body || 'No changelog provided',
      isNewer,
    };

    if (isNewer) {
      warn('version.update_available', {
        current: currentVersion,
        latest: latestVersion,
      });
    } else {
      info('version.up_to_date', { current: currentVersion });
    }

    return versionInfo;
  } catch (error) {
    logError('version.check_failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      current: currentVersion,
      latest: currentVersion,
      url: '',
      publishedAt: '',
      changelog: '',
      isNewer: false,
    };
  }
}

export function getVersion(): string {
  // Try to get from package.json
  try {
    // @ts-ignore - APP_VERSION would be injected at build time
    if (typeof APP_VERSION !== 'undefined') {
      // @ts-ignore
      return APP_VERSION;
    }
  } catch {
    // Ignore
  }

  // Fallback to 1.0.0
  return '1.0.0';
}

// Changelog entry structure
export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | 'security';
  changes: string[];
}

// Parse changelog markdown
export function parseChangelog(changelog: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = changelog.split('\n');
  let currentEntry: ChangelogEntry | null = null;

  for (const line of lines) {
    // Match version header: ## [version] - date
    const versionMatch = line.match(/^## \[?v?([\d.]+)\]? - (.+)$/);
    if (versionMatch) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2],
        type: 'patch',
        changes: [],
      };
      continue;
    }

    // Match change types
    if (currentEntry) {
      if (line.match(/^\*\*Breaking Changes\*\*/i)) {
        currentEntry.type = 'major';
      } else if (line.match(/^\*\*Security/i)) {
        currentEntry.type = 'security';
      } else if (line.startsWith('-') || line.startsWith('*')) {
        const change = line.replace(/^[-*]\s*/, '').trim();
        if (change) {
          currentEntry.changes.push(change);
        }
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

export function formatChangelog(entries: ChangelogEntry[]): string {
  return entries
    .map((entry) => {
      const typeEmoji = {
        major: '🔴',
        minor: '🟡',
        patch: '🟢',
        security: '🛡️',
      }[entry.type];

      const changes = entry.changes.map((c) => `- ${c}`).join('\n');

      return `## ${typeEmoji} v${entry.version} - ${entry.date}\n\n${changes}`;
    })
    .join('\n\n');
}

// Check if update check was recently done (cache for 24 hours)
export function shouldCheckForUpdates(): boolean {
  try {
    const lastCheck = localStorage.getItem('clipflow-last-update-check');
    if (!lastCheck) return true;

    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();
    const hoursSinceCheck = (now - lastCheckTime) / (1000 * 60 * 60);

    return hoursSinceCheck >= 24;
  } catch {
    return true;
  }
}

export function recordUpdateCheck(): void {
  try {
    localStorage.setItem('clipflow-last-update-check', Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}
