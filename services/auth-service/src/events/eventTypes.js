// Event Topics
export const TOPICS = {
  USER_EVENTS: 'user-events',
  AUTH_EVENTS: 'auth-events',
  SYSTEM_EVENTS: 'system-events'
};

// Event Types
export const EVENT_TYPES = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGED: 'user.password_changed',

  // Auth Events
  TOKEN_REFRESHED: 'auth.token_refreshed',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',
  TWO_FA_ENABLED: 'auth.two_fa_enabled',
  TWO_FA_DISABLED: 'auth.two_fa_disabled',

  // System Events
  SERVICE_STARTED: 'system.service_started',
  SERVICE_STOPPED: 'system.service_stopped',
  DATABASE_CONNECTED: 'system.database_connected'
};
