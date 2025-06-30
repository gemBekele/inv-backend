export const CACHE_KEYS = {
  USER: 'user',
  USERS_LIST: 'users_list',
  USER_PERMISSIONS: 'user_permissions',
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
} as const;