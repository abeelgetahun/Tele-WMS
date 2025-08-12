import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  managerId: z.string().optional(),
})

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  minStock: z.number().min(0, "Minimum stock cannot be negative"),
  maxStock: z.number().min(1, "Maximum stock must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  supplier: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
})

export const stockTransferSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  notes: z.string().optional(),
})

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_CLERK", "TECHNICIAN", "AUDITOR"]),
  warehouseId: z.string().optional(),
})
