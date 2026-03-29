import { ContractConfig, ContractVersion } from './types';

/**
 * Contract version manager providing object-oriented access to version validation and utilities.
 * Encapsulates all version-related functionality including validation, comparison, and sorting.
 */
export class ContractVersionManager {
  private static instance: ContractVersionManager;

  private constructor () {
    // Private constructor for singleton pattern.
  }

  /**
   * Get the singleton instance of ContractVersionManager.
   */
  public static getInstance (): ContractVersionManager {
    if (!ContractVersionManager.instance) {
      ContractVersionManager.instance = new ContractVersionManager();
    }
    return ContractVersionManager.instance;
  }

  /**
   * Type guard to check if a value is a valid ContractVersion.
   */
  public isValidContractVersion (value: unknown): value is ContractVersion {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const version = value as Record<string, unknown>;

    return (
      typeof version.tag === 'string' &&
      typeof version.name === 'string' &&
      typeof version.isDeprecated === 'boolean' &&
      typeof version.deploymentDate === 'string' &&
      (version.description === undefined || typeof version.description === 'string')
    );
  }

  /**
   * Type guard to check if a value is a valid ContractConfig.
   */
  public isVersionedContractConfig (value: unknown): value is ContractConfig {
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
      this.isValidContractVersion(config.version)
    );
  }

  /**
   * Validates a version string format.
   */
  public isValidVersionString (version: string): boolean {
    // Basic validation: version should start with 'v' followed by semantic versioning
    const versionRegex = /^v\d+\.\d+(\.\d+)?(-\w+)?$/;
    return versionRegex.test(version);
  }

  /**
   * Compares two version strings and returns comparison result.
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  public compareVersions (v1: string, v2: string): number {
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
  public sortVersionsDescending (versions: ContractVersion[]): ContractVersion[] {
    return versions.slice().sort((a, b) => this.compareVersions(b.tag, a.tag));
  }

  /**
   * Sorts versions in ascending order (oldest first).
   */
  public sortVersionsAscending (versions: ContractVersion[]): ContractVersion[] {
    return versions.slice().sort((a, b) => this.compareVersions(a.tag, b.tag));
  }

  /**
   * Gets the latest non-deprecated version from a list of versions.
   */
  public LatestStableVersion (versions: ContractVersion[]): ContractVersion | null {
    const stableVersions = versions.filter(version => !version.isDeprecated);
    const sorted = this.sortVersionsDescending(stableVersions);
    return sorted[0] || null;
  }

  /**
   * Gets the latest version (including deprecated ones) from a list of versions.
   */
  public getLatestVersion (versions: ContractVersion[]): ContractVersion | null {
    const sorted = this.sortVersionsDescending(versions);
    return sorted[0] || null;
  }

  /**
   * Gets all stable (non-deprecated) versions from a list of versions.
   */
  public getStableVersions (versions: ContractVersion[]): ContractVersion[] {
    return versions.filter(version => !version.isDeprecated);
  }

  /**
   * Gets all deprecated versions from a list of versions.
   */
  public DeprecatedVersions (versions: ContractVersion[]): ContractVersion[] {
    return versions.filter(version => version.isDeprecated);
  }

  /**
   * Validates contract version compatibility.
   */
  public isVersionCompatible (version: ContractVersion, minVersion?: string): boolean {
    if (!minVersion) {
      return true;
    }

    return this.compareVersions(version.tag, minVersion) >= 0;
  }

  /**
   * Checks if a version is newer than another version.
   */
  public isVersionNewer (version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) > 0;
  }

  /**
   * Checks if a version is older than another version.
   */
  public isVersionOlder (version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) < 0;
  }

  /**
   * Checks if two versions are equal.
   */
  public areVersionsEqual (version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) === 0;
  }

  /**
   * Creates a new ContractVersion object with validation.
   */
  public createVersion (
    tag: string,
    name: string,
    deploymentDate: string,
    isDeprecated: boolean = false,
    description?: string,
  ): ContractVersion {
    if (!this.isValidVersionString(tag)) {
      throw new Error(`Invalid version tag format: ${tag}`);
    }

    const version: ContractVersion = {
      tag,
      name,
      deploymentDate,
      isDeprecated,
      description,
    };

    if (!this.isValidContractVersion(version)) {
      throw new Error('Created version object is invalid');
    }

    return version;
  }

  /**
   * Fluent interface for working with a specific version.
   */
  public forVersion (version: ContractVersion): VersionOperations {
    return new VersionOperations(this, version);
  }

  /**
   * Fluent interface for working with a collection of versions.
   */
  public forVersions (versions: ContractVersion[]): VersionCollectionOperations {
    return new VersionCollectionOperations(this, versions);
  }
}

/**
 * Fluent interface for version-specific operations.
 */
class VersionOperations {
  constructor (
    private manager: ContractVersionManager,
    private version: ContractVersion,
  ) {}

  /**
   * Check if this version is compatible with a minimum version.
   */
  public isCompatibleWith (minVersion: string): boolean {
    return this.manager.isVersionCompatible(this.version, minVersion);
  }

  /**
   * Check if this version is deprecated.
   */
  public isDeprecated (): boolean {
    return this.version.isDeprecated;
  }

  /**
   * Check if this version is stable (not deprecated).
   */
  public isStable (): boolean {
    return !this.version.isDeprecated;
  }

  /**
   * Check if this version is newer than another version.
   */
  public isNewerThan (otherVersion: string): boolean {
    return this.manager.isVersionNewer(this.version.tag, otherVersion);
  }

  /**
   * Check if this version is older than another version.
   */
  public isOlderThan (otherVersion: string): boolean {
    return this.manager.isVersionOlder(this.version.tag, otherVersion);
  }

  /**
   * Check if this version equals another version.
   */
  public equals (otherVersion: string): boolean {
    return this.manager.areVersionsEqual(this.version.tag, otherVersion);
  }
}

/**
 * Fluent interface for version collection operations.
 */
class VersionCollectionOperations {
  constructor (
    private manager: ContractVersionManager,
    private versions: ContractVersion[],
  ) {}

  /**
   * Sort versions in descending order (newest first).
   */
  public sortDescending (): ContractVersion[] {
    return this.manager.sortVersionsDescending(this.versions);
  }

  /**
   * Sort versions in ascending order (oldest first).
   */
  public sortAscending (): ContractVersion[] {
    return this.manager.sortVersionsAscending(this.versions);
  }

  /**
   * Get only stable (non-deprecated) versions.
   */
  public stableOnly (): ContractVersion[] {
    return this.manager.getStableVersions(this.versions);
  }

  /**
   * Get only deprecated versions.
   */
  public deprecatedOnly (): ContractVersion[] {
    return this.manager.DeprecatedVersions(this.versions);
  }

  /**
   * Get the latest stable version.
   */
  public latestStable (): ContractVersion | null {
    return this.manager.LatestStableVersion(this.versions);
  }

  /**
   * Get the latest version (including deprecated).
   */
  public latest (): ContractVersion | null {
    return this.manager.getLatestVersion(this.versions);
  }

  /**
   * Filter versions by compatibility with a minimum version.
   */
  public compatibleWith (minVersion: string): ContractVersion[] {
    return this.versions.filter(version =>
      this.manager.isVersionCompatible(version, minVersion),
    );
  }
}

/**
 * Global contract version manager instance.
 */
export const contractVersionManager = ContractVersionManager.getInstance();
