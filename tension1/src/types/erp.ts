// Core ERP Types for Garment Manufacturing

export type UnitType = 'KG' | 'Meter';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unitType: UnitType;
  pricePerUnit: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  materialId: string;
  materialName: string;
  vendorName: string;
  vendorLocation: string;
  quantity: number;
  unitType: UnitType;
  pricePerUnit: number;
  totalPrice: number;
  initialBalance?: number;
  finalBalance?: number;
  timestamp: Date;
  status: 'Active' | 'Merged';
  mergedIds?: string[];
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Credit';
export type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Outsourced' | 'Delivered';

export interface Order {
  id: string;
  clientName: string;
  productName: string;
  quantity: number;
  dueDate: Date;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totalAmount: number;
  advance?: number;  // Amount paid upfront
  credit?: number;  // Remaining balance (Total - Advance, min 0)
  vatBalance?: number;  // VAT balance for the order
  createdAt: Date;
}

export interface Sale {
  id: string;
  orderId?: string;
  clientName: string;
  items: SaleItem[];
  totalRevenue: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
}

export interface SaleItem {
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface WasteRecord {
  id: string;
  materialName: string;
  quantity: number;
  unitType: UnitType;
  reason?: string;
  timestamp: Date;
}

export type PayrollType = 'Monthly' | 'PieceRate';

export interface Employee {
  id: string;
  name: string;
  role: string;
  payrollType: PayrollType;
  monthlySalary?: number;
  ratePerPiece?: number;
  advanceTaken: number;
  avatarUrl?: string;
  joinedAt: Date;
  lastPaymentAt?: Date;
  createdAt: Date;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollType: PayrollType;
  period: string;
  // Monthly fields
  baseSalary?: number;
  advanceDeducted?: number;
  // Piece-rate fields
  quantityProduced?: number;
  ratePerPiece?: number;
  // Calculated
  netPayable: number;
  paidAt: Date;
}

export interface UtilizationInput {
  materialId: string;
  productCount: number;
  consumptionPerUnit: number; // How much material per finished product
}

export interface UtilizationResult {
  materialName: string;
  requiredQuantity: number;
  currentStock: number;
  unitType: UnitType;
  sufficient: boolean;
  deficit: number;
}

// Bill of Materials / Production Recipes

// Units for recipe ingredients – supports legacy stock units plus common units
export type RecipeUnit = UnitType | 'pcs' | 'meter' | 'ft' | 'kg' | 'g' | 'L' | 'ml';

export interface RecipeIngredient {
  // Optional link to a stock material (for availability checks)
  materialId?: string;
  materialName: string;
  quantityPerUnit: number;
  unitType: RecipeUnit;
}

export interface Recipe {
  id: string;
  productName: string;
  ingredients: RecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalMaterials: number;
  lowStockCount: number;
  pendingOrders: number;
  totalSalesThisMonth: number;
  totalWaste: number;
  employeeCount: number;
}
