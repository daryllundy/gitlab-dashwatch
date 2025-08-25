// Version comparison and migration utilities
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }
  
  return 0;
};

export const isVersionNewer = (version1: string, version2: string): boolean => {
  return compareVersions(version1, version2) > 0;
};

export const isVersionOlder = (version1: string, version2: string): boolean => {
  return compareVersions(version1, version2) < 0;
};

export const isVersionEqual = (version1: string, version2: string): boolean => {
  return compareVersions(version1, version2) === 0;
};

export const getMigrationPath = (fromVersion: string, toVersion: string, versionProgression: string[]): string[] => {
  const migrations: string[] = [];
  
  const fromIndex = versionProgression.indexOf(fromVersion);
  const toIndex = versionProgression.indexOf(toVersion);
  
  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    return [];
  }
  
  // Build migration path
  for (let i = fromIndex; i < toIndex; i++) {
    const from = versionProgression[i];
    const to = versionProgression[i + 1];
    migrations.push(`${from}_to_${to}`);
  }
  
  return migrations;
};
