import MedicalShop from "../models/MedicalShop.js";
import Medicine from "../models/Medicine.js";
import Inventory from "../models/Inventory.js";
import { publishEvent } from "./kafka.js";
import { TOPICS, EVENT_TYPES } from "./eventTypes.js";

/**
 * Handle user events from auth service
 */
export const handleUserEvents = async (event, context) => {
  try {
    switch (event.type) {
      case 'user.registered':
        await handleUserRegistered(event);
        break;
      case 'user.updated':
        await handleUserUpdated(event);
        break;
      case 'user.deleted':
        await handleUserDeleted(event);
        break;
      default:
        console.log(`Unhandled user event: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling user event:', error);
  }
};

/**
 * Handle user registration event
 */
const handleUserRegistered = async (event) => {
  const { userId, email, role } = event.data;

  // If user registered as shop-owner, we might want to send a welcome notification
  // or prepare shop creation resources
  if (role === 'shop-owner') {
    console.log(`🏪 New shop owner registered: ${email}`);

    // Publish event for notification service
    await publishEvent(TOPICS.SHOP_EVENTS, EVENT_TYPES.SHOP_CREATED, {
      userId,
      email,
      role,
      action: 'welcome_shop_owner'
    });
  }
};

/**
 * Handle user update event
 */
const handleUserUpdated = async (event) => {
  const { userId, changes } = event.data;

  // If user's role changed to shop-owner, update related shops
  if (changes.includes('role')) {
    const shops = await MedicalShop.find({ ownerId: userId });
    if (shops.length > 0) {
      console.log(`🏪 User role updated for shop owner: ${userId}`);
    }
  }
};

/**
 * Handle user deletion event
 */
const handleUserDeleted = async (event) => {
  const { userId } = event.data;

  // Handle shop owner deletion - might need to transfer shops or mark as inactive
  const shops = await MedicalShop.find({ ownerId: userId });
  if (shops.length > 0) {
    console.log(`⚠️ Handling shop owner deletion: ${userId}`);

    // Mark shops as inactive
    await MedicalShop.updateMany(
      { ownerId: userId },
      { status: 'inactive' }
    );

    // Publish shop status change events
    for (const shop of shops) {
      await publishEvent(TOPICS.SHOP_EVENTS, EVENT_TYPES.SHOP_STATUS_CHANGED, {
        shopId: shop._id,
        oldStatus: shop.status,
        newStatus: 'inactive',
        reason: 'Owner account deleted'
      });
    }
  }
};

/**
 * Handle order events (for future integration)
 */
export const handleOrderEvents = async (event, context) => {
  try {
    switch (event.type) {
      case 'order.placed':
        await handleOrderPlaced(event);
        break;
      case 'order.confirmed':
        await handleOrderConfirmed(event);
        break;
      case 'order.delivered':
        await handleOrderDelivered(event);
        break;
      case 'order.cancelled':
        await handleOrderCancelled(event);
        break;
      default:
        console.log(`Unhandled order event: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling order event:', error);
  }
};

/**
 * Handle order placed event - update inventory
 */
const handleOrderPlaced = async (event) => {
  const { orderId, shopId, items, userId } = event.data;

  console.log(`📦 Processing order: ${orderId} for shop: ${shopId}`);

  try {
    // Reserve inventory for the order
    for (const item of items) {
      const inventory = await Inventory.findOne({
        shopId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber
      });

      if (!inventory) {
        console.error(`Inventory not found for medicine: ${item.medicineId}`);
        continue;
      }

      if (inventory.availableQuantity < item.quantity) {
        console.error(`Insufficient stock for medicine: ${item.medicineId}`);
        // In a real system, you might want to cancel the order or notify
        continue;
      }

      // Reserve the quantity
      inventory.reservedQuantity += item.quantity;
      await inventory.save();

      // Record stock movement
      await inventory.addStockMovement(
        'out',
        item.quantity,
        'order_reservation',
        userId,
        orderId,
        `Reserved for order ${orderId}`
      );
    }

    console.log(`✅ Inventory reserved for order: ${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to reserve inventory for order ${orderId}:`, error);
  }
};

/**
 * Handle order confirmed event - actually deduct from inventory
 */
const handleOrderConfirmed = async (event) => {
  const { orderId, shopId, items, userId } = event.data;

  console.log(`✅ Confirming order: ${orderId}`);

  try {
    for (const item of items) {
      const inventory = await Inventory.findOne({
        shopId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber
      });

      if (!inventory) continue;

      // Deduct from reserved quantity and actual quantity
      inventory.reservedQuantity -= item.quantity;
      inventory.quantity -= item.quantity;

      // Update available quantity
      inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);

      await inventory.save();

      // Record stock movement
      await inventory.addStockMovement(
        'out',
        item.quantity,
        'order_confirmed',
        userId,
        orderId,
        `Sold in order ${orderId}`
      );
    }

    console.log(`✅ Inventory updated for confirmed order: ${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to update inventory for confirmed order ${orderId}:`, error);
  }
};

/**
 * Handle order cancelled event - release reserved inventory
 */
const handleOrderCancelled = async (event) => {
  const { orderId, shopId, items } = event.data;

  console.log(`❌ Cancelling order: ${orderId}`);

  try {
    for (const item of items) {
      const inventory = await Inventory.findOne({
        shopId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber
      });

      if (!inventory) continue;

      // Release reserved quantity
      inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - item.quantity);
      inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);

      await inventory.save();

      // Record stock movement
      await inventory.addStockMovement(
        'adjustment',
        inventory.quantity,
        'order_cancelled',
        'system',
        orderId,
        `Reservation released for cancelled order ${orderId}`
      );
    }

    console.log(`✅ Inventory reservation released for cancelled order: ${orderId}`);
  } catch (error) {
    console.error(`❌ Failed to release inventory for cancelled order ${orderId}:`, error);
  }
};

/**
 * Handle order delivered event - could trigger reorder alerts
 */
const handleOrderDelivered = async (event) => {
  const { orderId, shopId, items } = event.data;

  console.log(`🚚 Order delivered: ${orderId}`);

  // Check if any medicines are now low in stock and trigger reorder alerts
  try {
    for (const item of items) {
      const inventory = await Inventory.findOne({
        shopId,
        medicineId: item.medicineId
      }).populate('medicineId', 'name');

      if (inventory && inventory.isLowStock()) {
        // Publish low stock alert
        await publishEvent(TOPICS.INVENTORY_EVENTS, EVENT_TYPES.LOW_STOCK_ALERT, {
          shopId,
          medicineId: item.medicineId,
          medicineName: inventory.medicineId?.name,
          currentStock: inventory.availableQuantity,
          threshold: inventory.alerts.lowStockThreshold
        });
      }
    }
  } catch (error) {
    console.error(`❌ Failed to check reorder alerts for delivered order ${orderId}:`, error);
  }
};

/**
 * Handle system events
 */
export const handleSystemEvents = async (event, context) => {
  try {
    switch (event.type) {
      case 'system.service_started':
        console.log(`🔄 Service started: ${event.data.serviceName}`);
        break;
      case 'system.service_stopped':
        console.log(`⏹️ Service stopped: ${event.data.serviceName}`);
        break;
      default:
        console.log(`Unhandled system event: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling system event:', error);
  }
};

/**
 * Initialize event handlers
 */
export const initEventHandlers = async () => {
  try {
    const { subscribeToTopics } = await import('./kafka.js');

    // Subscribe to relevant topics
    await subscribeToTopics({
      'user-events': handleUserEvents,
      'order-events': handleOrderEvents,
      'system-events': handleSystemEvents
    });

    console.log('🎧 Medical Shop Service - Event handlers initialized');
  } catch (error) {
    console.error('❌ Failed to initialize event handlers:', error);
  }
};
