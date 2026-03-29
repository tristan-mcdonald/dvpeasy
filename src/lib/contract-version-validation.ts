import { ContractVersion, ContractConfig } from '../config/contracts';

/**
 * Type guard to check if a value is a valid ContractVersion.
 */
export function isValidContractVersion (value: unknown): value is ContractVersion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const version = value as Record<string, unknown>;

  return (
    typeof version.tag === 'string' &&
    typeof version.name === 'string' &&
    typeof version.isDeprecated === 'boolean' &&
    (version.releaseDate === undefined || typeof version.releaseDate === 'string') &&
    (version.description === undefined || typeof version.description === 'string')
  );
}

/**
 * Type guard to check if a value is a valid ContractConfig.
 */
export function isVersionedContractConfig (value: unknown): value is ContractConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const config = value as Record<string, unknown>;

  return (
    typeof config.networkId === 'string' &&
    typeof config.dvpAddress === 'string' &&
    typeof config.dvpHelperAddress === 'string' &&
    Array.isArray(config.dvpAbi) &&
    Array.isArray(config.dvpHelperAbi) &&
    config.version !== undefined &&
    isValidContractVersion(config.version)
  );
}

/**
 * Validates a version string format.
 */
export function isValidVersionString (version: string): boolean {
  // Basic validation: version should start with 'v' followed by semantic versioning
  const versionRegex = /^v\d+\.\d+(\.\d+)?(-\w+)?$/;
  return versionRegex.test(version);
}

/**
 * Compares two version strings and returns comparison result.
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions (v1: string, v2: string): number {
  const normalize = (v: string) => {
    // Remove 'v' prefix and split by '.' and '-'
    const parts = v.replace(/^v/, '').split(/[.-]/);
    return parts.map(part => {
      const num = parseInt(part, 10);
      return isNaN(num) ? part : num;
    });
  };

  const parts1 = normalize(v1);
  const parts2 = normalize(v2);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (typeof part1 === 'number' && typeof part2 === 'number') {
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    } else {
      const str1 = String(part1);
      const str2 = String(part2);
      if (str1 < str2) return -1;
      if (str1 > str2) return 1;
    }
  }

  return 0;
}

/**
 * Sorts versions in descending order (newest first).
 */
export function sortVersionsDescending (versions: ContractVersion[]): ContractVersion[] {
  return versions.slice().sort((a, b) => compareVersions(b.tag, a.tag));
}

/**
 * Gets the latest non-deprecated version from a list of versions.
 */
export function LatestStableVersion (versions: ContractVersion[]): ContractVersion | null {
  const stableVersions = versions.filter(version => !version.isDeprecated);
  const sorted = sortVersionsDescending(stableVersions);
  return sorted[0] || null;
}

/**
 * Validates contract version compatibility.
 */
export function isVersionCompatible (version: ContractVersion, minVersion?: string): boolean {
  if (!minVersion) {
    return true;
  }

  return compareVersions(version.tag, minVersion) >= 0;
}
