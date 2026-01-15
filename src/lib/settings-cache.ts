import NodeCache from 'node-cache';

// Cache settings for 5 minutes
const settingsCache = new NodeCache({ stdTTL: 300 });

export function getSettingsCacheKey(brandId: string, branchId: string): string {
  return `settings:${brandId}:${branchId}`;
}

export function getCachedSettings(brandId: string, branchId: string): any {
  return settingsCache.get(getSettingsCacheKey(brandId, branchId));
}

export function setCachedSettings(brandId: string, branchId: string, settings: any): void {
  settingsCache.set(getSettingsCacheKey(brandId, branchId), settings);
}

export function clearSettingsCache(brandId: string, branchId: string): void {
  settingsCache.del(getSettingsCacheKey(brandId, branchId));
}