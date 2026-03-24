import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Material,
  Purchase,
  Order,
  Sale,
  WasteRecord,
  Employee,
  PayrollRecord,
  Recipe,
  DashboardMetrics,
} from '@/types/erp';

interface ERPState {
  // Data
  materials: Material[];
  purchases: Purchase[];
  orders: Order[];
  sales: Sale[];
  wasteRecords: WasteRecord[];
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  recipes: Recipe[];

  // Actions - Materials
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  adjustStock: (id: string, quantityChange: number) => void;

  // Actions - Purchases
  addPurchase: (purchase: Omit<Purchase, 'id' | 'status'>) => void;
  updatePurchase: (id: string, updates: Partial<Omit<Purchase, 'id' | 'status'>>) => void;
  mergePurchases: (ids: string[]) => void;

  // Actions - Orders
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  markOrderDelivered: (id: string) => void;

  // Actions - Sales
  addSale: (sale: Omit<Sale, 'id'>) => void;

  // Actions - Waste
  addWasteRecord: (waste: Omit<WasteRecord, 'id'>) => void;
  deleteWasteRecord: (id: string) => void;

  // Actions - Employees
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'advanceTaken' | 'joinedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  recordAdvance: (id: string, amount: number) => void;

  // Actions - Payroll
  processPayroll: (record: Omit<PayrollRecord, 'id'>) => void;

  // Actions - Recipes
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteRecipe: (id: string) => void;

  // Computed
  getDashboardMetrics: () => DashboardMetrics;
  getLowStockMaterials: () => Material[];
  getOutsourcedOrders: () => Order[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useERPStore = create<ERPState>()(
  persist(
    (set, get) => ({
      // Initial data with demo content
      materials: [
        {
          id: '1',
          name: 'Cotton Fabric',
          quantity: 150,
          unitType: 'Meter',
          pricePerUnit: 12.5,
          lowStockThreshold: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Polyester Blend',
          quantity: 25,
          unitType: 'Meter',
          pricePerUnit: 8.75,
          lowStockThreshold: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Denim Fabric',
          quantity: 80,
          unitType: 'Meter',
          pricePerUnit: 18.0,
          lowStockThreshold: 40,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          name: 'Thread Spool',
          quantity: 5,
          unitType: 'KG',
          pricePerUnit: 45.0,
          lowStockThreshold: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      purchases: [
        {
          id: '1',
          materialId: '1',
          materialName: 'Cotton Fabric',
          vendorName: 'TextileCo',
          vendorLocation: 'Mumbai, India',
          quantity: 100,
          unitType: 'Meter',
          pricePerUnit: 12.5,
          totalPrice: 1250,
          timestamp: new Date(Date.now() - 86400000 * 2),
          status: 'Active',
        },
        {
          id: '2',
          materialId: '3',
          materialName: 'Denim Fabric',
          vendorName: 'DenimWorld',
          vendorLocation: 'Guangzhou, China',
          quantity: 50,
          unitType: 'Meter',
          pricePerUnit: 18.0,
          totalPrice: 900,
          timestamp: new Date(Date.now() - 86400000),
          status: 'Active',
        },
      ],
      orders: [
        {
          id: '1',
          clientName: 'Fashion Retail Inc.',
          productName: 'Cotton T-Shirts',
          quantity: 500,
          dueDate: new Date(Date.now() + 86400000 * 14),
          paymentMethod: 'Bank',
          status: 'In Progress',
          totalAmount: 7500,
          advance: 3000,
          credit: 4500,
          createdAt: new Date(Date.now() - 86400000 * 5),
        },
        {
          id: '2',
          clientName: 'Urban Styles',
          productName: 'Denim Jeans',
          quantity: 200,
          dueDate: new Date(Date.now() + 86400000 * 7),
          paymentMethod: 'Credit',
          status: 'Pending',
          totalAmount: 12000,
          advance: 0,
          credit: 12000,
          createdAt: new Date(Date.now() - 86400000 * 3),
        },
        {
          id: '3',
          clientName: 'QuickFashion',
          productName: 'Polo Shirts',
          quantity: 100,
          dueDate: new Date(Date.now() + 86400000 * 3),
          paymentMethod: 'Cash',
          status: 'Outsourced',
          totalAmount: 2500,
          advance: 2500,
          credit: 0,
          createdAt: new Date(Date.now() - 86400000 * 10),
        },
      ],
      sales: [
        {
          id: '1',
          orderId: '4',
          clientName: 'Summer Collection Ltd',
          items: [
            { productName: 'Cotton Shirts', quantity: 100, pricePerUnit: 15, total: 1500 },
            { productName: 'Cotton Pants', quantity: 50, pricePerUnit: 25, total: 1250 },
          ],
          totalRevenue: 2750,
          paymentMethod: 'Bank',
          timestamp: new Date(Date.now() - 86400000 * 7),
        },
      ],
      wasteRecords: [
        {
          id: '1',
          materialName: 'Cotton Fabric',
          quantity: 5.5,
          unitType: 'Meter',
          reason: 'Cutting waste',
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: '2',
          materialName: 'Thread Spool',
          quantity: 0.2,
          unitType: 'KG',
          reason: 'Defective batch',
          timestamp: new Date(),
        },
      ],
      employees: [
        {
          id: '1',
          name: 'Rahul Sharma',
          role: 'Senior Tailor',
          payrollType: 'Monthly',
          monthlySalary: 35000,
          advanceTaken: 5000,
          joinedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Priya Patel',
          role: 'Production Worker',
          payrollType: 'PieceRate',
          ratePerPiece: 10,
          advanceTaken: 0,
          joinedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Amit Kumar',
          role: 'Quality Inspector',
          payrollType: 'Monthly',
          monthlySalary: 28000,
          advanceTaken: 2000,
          joinedAt: new Date(),
          createdAt: new Date(),
        },
      ],
      payrollRecords: [],
      recipes: [],

      // Material actions
      addMaterial: (material) =>
        set((state) => ({
          materials: [
            ...state.materials,
            {
              ...material,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
          ),
        })),

      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      adjustStock: (id, quantityChange) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id
              ? { ...m, quantity: Math.max(0, m.quantity + quantityChange), updatedAt: new Date() }
              : m
          ),
        })),

      // Purchase actions
      addPurchase: (purchase) =>
        set((state) => {
          const updatedMaterials = state.materials.map((m) =>
            m.id === purchase.materialId
              ? { ...m, quantity: m.quantity + purchase.quantity, updatedAt: new Date() }
              : m
          );
          return {
            purchases: [...state.purchases, { ...purchase, id: generateId(), status: 'Active' }],
            materials: updatedMaterials,
          };
        }),

      updatePurchase: (id, updates) =>
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      mergePurchases: (ids) =>
        set((state) => {
          const selected = state.purchases.filter((p) => ids.includes(p.id));
          if (selected.length < 2) return state;

          const masterOrder: Purchase = {
            id: generateId(),
            materialId: selected[0].materialId, // Fallback to first
            materialName: selected.map(s => s.materialName).filter((v, i, a) => a.indexOf(v) === i).join(" + "),
            vendorName: selected.map(s => s.vendorName).join(" + "),
            vendorLocation: selected[0].vendorLocation,
            quantity: selected.reduce((sum, s) => sum + s.quantity, 0),
            unitType: selected[0].unitType,
            pricePerUnit: selected.reduce((sum, s) => sum + s.totalPrice, 0) / selected.reduce((sum, s) => sum + s.quantity, 0),
            totalPrice: selected.reduce((sum, s) => sum + s.totalPrice, 0),
            initialBalance: selected.reduce((sum, s) => sum + (s.initialBalance || 0), 0),
            finalBalance: selected.reduce((sum, s) => sum + (s.finalBalance || 0), 0),
            timestamp: new Date(),
            status: 'Active',
            mergedIds: ids,
          };

          const updatedPurchases = state.purchases.map((p) =>
            ids.includes(p.id) ? { ...p, status: 'Merged' as const } : p
          );

          return {
            purchases: [...updatedPurchases, masterOrder],
          };
        }),

      // Order actions
      addOrder: (order) =>
        set((state) => ({
          orders: [...state.orders, { ...order, id: generateId(), createdAt: new Date() }],
        })),

      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),

      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      markOrderDelivered: (id) => {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order) return;

        const sale: Omit<Sale, 'id'> = {
          orderId: order.id,
          clientName: order.clientName,
          items: [
            {
              productName: order.productName,
              quantity: order.quantity,
              pricePerUnit: order.totalAmount / order.quantity,
              total: order.totalAmount,
            },
          ],
          totalRevenue: order.totalAmount,
          paymentMethod: order.paymentMethod,
          timestamp: new Date(),
        };

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status: 'Delivered' as const } : o
          ),
          sales: [...state.sales, { ...sale, id: Math.random().toString(36).substring(2, 11) }],
        }));
      },

      // Sale actions
      addSale: (sale) =>
        set((state) => ({
          sales: [...state.sales, { ...sale, id: generateId() }],
        })),

  // Waste actions
  addWasteRecord: (waste) =>
    set((state) => ({
      wasteRecords: [...state.wasteRecords, { ...waste, id: generateId() }],
    })),

  deleteWasteRecord: (id) =>
    set((state) => ({
      wasteRecords: state.wasteRecords.filter((w) => w.id !== id),
    })),

      // Employee actions
      addEmployee: (employee) =>
        set((state) => ({
          employees: [
            ...state.employees,
            { ...employee, id: generateId(), advanceTaken: 0, joinedAt: new Date(), createdAt: new Date() },
          ],
        })),

      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      recordAdvance: (id, amount) =>
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, advanceTaken: e.advanceTaken + amount } : e
          ),
        })),

      // Payroll actions
      processPayroll: (record) =>
        set((state) => {
          // Reset advance and set lastPaymentAt after payroll processing
          const updatedEmployees = state.employees.map((e) =>
            e.id === record.employeeId ? { ...e, advanceTaken: 0, lastPaymentAt: new Date() } : e
          );
          return {
            payrollRecords: [...state.payrollRecords, { ...record, id: generateId() }],
            employees: updatedEmployees,
          };
        }),

      // Recipe actions
      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [
            ...state.recipes,
            {
              ...recipe,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateRecipe: (id, recipe) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id
              ? { ...r, ...recipe, updatedAt: new Date() }
              : r
          ),
        })),

      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),

      // Computed values
      getDashboardMetrics: () => {
        const state = get();
        const currentMonth = new Date().getMonth();
        const monthSales = state.sales.filter(
          (s) => new Date(s.timestamp).getMonth() === currentMonth
        );

        return {
          totalMaterials: state.materials.length,
          lowStockCount: state.materials.filter((m) => m.quantity <= m.lowStockThreshold).length,
          pendingOrders: state.orders.filter(
            (o) => o.status === 'Pending' || o.status === 'In Progress'
          ).length,
          totalSalesThisMonth: monthSales.reduce((sum, s) => sum + s.totalRevenue, 0),
          totalWaste: state.wasteRecords.reduce((sum, w) => sum + w.quantity, 0),
          employeeCount: state.employees.length,
        };
      },

      getLowStockMaterials: () => {
        const state = get();
        return state.materials.filter((m) => m.quantity <= m.lowStockThreshold);
      },

      getOutsourcedOrders: () => {
        const state = get();
        return state.orders.filter((o) => o.status === 'Outsourced');
      },
    }),
    {
      name: 'garment-erp-storage',
    }
  )
);
