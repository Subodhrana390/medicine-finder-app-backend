import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalShop",
      required: [true, "Shop ID is required"]
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "Medicine ID is required"]
    },

    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      trim: true
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0
    },

    reservedQuantity: {
      type: Number,
      min: [0, "Reserved quantity cannot be negative"],
      default: 0
    },

    availableQuantity: {
      type: Number,
      min: [0, "Available quantity cannot be negative"],
      default: 0
    },

    unit: {
      type: String,
      enum: ["tablets", "capsules", "bottles", "tubes", "packs", "strips", "vials", "pieces"],
      default: "pieces"
    },

    pricing: {
      costPrice: {
        type: Number,
        required: [true, "Cost price is required"],
        min: [0, "Cost price cannot be negative"]
      },
      sellingPrice: {
        type: Number,
        required: [true, "Selling price is required"],
        min: [0, "Selling price cannot be negative"]
      },
      mrp: {
        type: Number,
        required: [true, "MRP is required"],
        min: [0, "MRP cannot be negative"]
      },
      discountPercentage: {
        type: Number,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"],
        default: 0
      },
      taxPercentage: {
        type: Number,
        min: [0, "Tax cannot be negative"],
        max: [100, "Tax cannot exceed 100%"],
        default: 0
      }
    },

    supplier: {
      name: {
        type: String,
        trim: true
      },
      contact: {
        type: String,
        trim: true
      },
      invoiceNumber: {
        type: String,
        trim: true
      }
    },

    manufacturingDate: {
      type: Date,
      required: [true, "Manufacturing date is required"]
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"]
    },

    location: {
      rack: { type: String, trim: true },
      shelf: { type: String, trim: true },
      bin: { type: String, trim: true }
    },

    status: {
      type: String,
      enum: ["active", "expired", "damaged", "returned", "low-stock"],
      default: "active"
    },

    alerts: {
      lowStockThreshold: {
        type: Number,
        min: [0, "Low stock threshold cannot be negative"],
        default: 10
      },
      expiryAlertDays: {
        type: Number,
        min: [0, "Expiry alert days cannot be negative"],
        default: 30
      },
      lastLowStockAlert: { type: Date },
      lastExpiryAlert: { type: Date }
    },

    stockMovements: [{
      type: {
        type: String,
        enum: ["in", "out", "adjustment", "return"],
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        enum: ["purchase", "sale", "damage", "expiry", "correction", "transfer"],
        required: true
      },
      reference: {
        type: String, // Order ID, Invoice ID, etc.
        trim: true
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        trim: true
      }
    }],

    lastStockUpdate: {
      type: Date,
      default: Date.now
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Compound indexes for better query performance
inventorySchema.index({ shopId: 1, medicineId: 1 }, { unique: true });
inventorySchema.index({ shopId: 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ "pricing.sellingPrice": 1 });
inventorySchema.index({ quantity: 1 });

// Virtual for profit margin
inventorySchema.virtual("profitMargin").get(function() {
  if (this.pricing.costPrice === 0) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
});

// Virtual for discounted price
inventorySchema.virtual("discountedPrice").get(function() {
  const discountAmount = (this.pricing.sellingPrice * this.pricing.discountPercentage) / 100;
  return this.pricing.sellingPrice - discountAmount;
});

// Virtual for final price including tax
inventorySchema.virtual("finalPrice").get(function() {
  const discountedPrice = this.discountedPrice;
  const taxAmount = (discountedPrice * this.pricing.taxPercentage) / 100;
  return discountedPrice + taxAmount;
});

// Instance method to check if item is low in stock
inventorySchema.methods.isLowStock = function() {
  return this.availableQuantity <= this.alerts.lowStockThreshold;
};

// Instance method to check if item is expiring soon
inventorySchema.methods.isExpiringSoon = function() {
  if (!this.expiryDate) return false;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + this.alerts.expiryAlertDays);
  return this.expiryDate <= alertDate;
};

// Instance method to check if item is expired
inventorySchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Instance method to add stock movement
inventorySchema.methods.addStockMovement = async function(
  type,
  quantity,
  reason,
  performedBy,
  reference = null,
  notes = ""
) {
  const movement = {
    type,
    quantity,
    reason,
    reference,
    performedBy,
    notes,
    timestamp: new Date()
  };

  this.stockMovements.push(movement);

  // Update quantity based on movement type
  if (type === "in") {
    this.quantity += quantity;
  } else if (type === "out") {
    this.quantity -= quantity;
  } else if (type === "adjustment") {
    this.quantity = quantity; // Set to specific quantity
  }

  // Update available quantity
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  this.lastStockUpdate = new Date();

  // Update status if needed
  if (this.isExpired()) {
    this.status = "expired";
  } else if (this.quantity === 0) {
    this.status = "out-of-stock";
  } else if (this.isLowStock()) {
    this.status = "low-stock";
  } else {
    this.status = "active";
  }

  await this.save();
  return this;
};

// Static method to find low stock items for a shop
inventorySchema.statics.findLowStockItems = function(shopId) {
  return this.find({
    shopId,
    status: { $in: ["active", "low-stock"] }
  }).populate("medicineId", "name genericName brand");
};

// Static method to find expiring items for a shop
inventorySchema.statics.findExpiringItems = function(shopId, daysAhead = 30) {
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + daysAhead);

  return this.find({
    shopId,
    expiryDate: { $lte: alertDate, $gt: new Date() },
    status: "active"
  }).populate("medicineId", "name genericName brand");
};

// Static method to get inventory summary for a shop
inventorySchema.statics.getInventorySummary = function(shopId) {
  return this.aggregate([
    { $match: { shopId: mongoose.Types.ObjectId(shopId) } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$quantity", "$pricing.costPrice"] } },
        lowStockItems: {
          $sum: {
            $cond: [
              { $lte: ["$availableQuantity", "$alerts.lowStockThreshold"] },
              1,
              0
            ]
          }
        },
        expiredItems: {
          $sum: {
            $cond: [
              { $lt: ["$expiryDate", new Date()] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to update available quantity
inventorySchema.pre("save", function(next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
