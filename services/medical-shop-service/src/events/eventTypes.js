// Event Topics
export const TOPICS = {
  SHOP_EVENTS: 'shop-events',
  MEDICINE_EVENTS: 'medicine-events',
  INVENTORY_EVENTS: 'inventory-events',
  SYSTEM_EVENTS: 'system-events'
};

// Event Types
export const EVENT_TYPES = {
  // Shop Events
  SHOP_CREATED: 'shop.created',
  SHOP_UPDATED: 'shop.updated',
  SHOP_STATUS_CHANGED: 'shop.status_changed',
  SHOP_VERIFIED: 'shop.verified',
  SHOP_DELETED: 'shop.deleted',

  // Medicine Events
  MEDICINE_CREATED: 'medicine.created',
  MEDICINE_UPDATED: 'medicine.updated',
  MEDICINE_DISCONTINUED: 'medicine.discontinued',
  MEDICINE_RESTOCKED: 'medicine.restocked',
  MEDICINE_BULK_IMPORTED: 'medicine.bulk_imported',

  // Inventory Events
  INVENTORY_ADDED: 'inventory.added',
  INVENTORY_UPDATED: 'inventory.updated',
  STOCK_MOVEMENT: 'inventory.stock_movement',
  LOW_STOCK_ALERT: 'inventory.low_stock_alert',
  EXPIRY_ALERT: 'inventory.expiry_alert',
  INVENTORY_BULK_UPDATED: 'inventory.bulk_updated',

  // Order Events (for future integration)
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // System Events
  SERVICE_STARTED: 'system.service_started',
  SERVICE_STOPPED: 'system.service_stopped',
  DATABASE_CONNECTED: 'system.database_connected'
};
