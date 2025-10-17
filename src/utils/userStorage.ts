const NAMESPACE_SEPARATOR = '::';

export const STORAGE_KEYS = {
  ENTERPRISES: 'casskai_enterprises',
  CURRENT_ENTERPRISE: 'casskai_current_enterprise',
  CURRENT_COMPANY_ID: 'casskai_current_company_id',
};

const isBrowserEnvironment = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getUserScopedKey = (baseKey: string, userId?: string | null): string =>
  userId ? `${baseKey}${NAMESPACE_SEPARATOR}${userId}` : baseKey;

const migrateLegacyValue = (baseKey: string, userScopedKey: string): string | null => {
  const legacyValue = window.localStorage.getItem(baseKey);
  if (legacyValue !== null) {
    window.localStorage.setItem(userScopedKey, legacyValue);
    window.localStorage.removeItem(baseKey);
  }
  return legacyValue;
};

export const readUserScopedItem = (baseKey: string, userId?: string | null): string | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const userScopedKey = getUserScopedKey(baseKey, userId);
  const existingValue = window.localStorage.getItem(userScopedKey);

  if (existingValue !== null || !userId) {
    return existingValue;
  }

  return migrateLegacyValue(baseKey, userScopedKey);
};

export const writeUserScopedItem = (baseKey: string, userId: string, value: string | null): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  const userScopedKey = getUserScopedKey(baseKey, userId);

  if (value === null) {
    window.localStorage.removeItem(userScopedKey);
  } else {
    window.localStorage.setItem(userScopedKey, value);
  }

  window.localStorage.removeItem(baseKey);
};

export const removeUserScopedItem = (baseKey: string, userId: string): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  window.localStorage.removeItem(getUserScopedKey(baseKey, userId));
};

export const purgeUserEnterpriseCache = (userId: string): void => {
  removeUserScopedItem(STORAGE_KEYS.ENTERPRISES, userId);
  removeUserScopedItem(STORAGE_KEYS.CURRENT_ENTERPRISE, userId);
  removeUserScopedItem(STORAGE_KEYS.CURRENT_COMPANY_ID, userId);
};

export const removeAllUserScopedEntriesForKey = (baseKey: string): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  const prefix = `${baseKey}${NAMESPACE_SEPARATOR}`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => window.localStorage.removeItem(key));
};
