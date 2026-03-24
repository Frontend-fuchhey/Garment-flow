import { useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useERPStore } from "@/stores/erpStore";
import { Order, OrderStatus, PaymentMethod } from "@/types/erp";
import {
  ClipboardList,
  Plus,
  ExternalLink,
  Pencil,
  Check,
  X,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

export default function OrdersPage() {
  const {
    orders,
    addOrder,
    updateOrder,
    updateOrderStatus,
    markOrderDelivered,
    getOutsourcedOrders,
  } = useERPStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Order>>({});
  const [formData, setFormData] = useState({
    clientName: "",
    productName: "",
    quantity: "",
    dueDate: "",
    paymentMethod: "Bank" as PaymentMethod,
    totalAmount: "",
    advance: "",
    vatBalance: "",
  });
  const [completedSearch, setCompletedSearch] = useState("");
  const [completedDateFilter, setCompletedDateFilter] = useState<string>("");

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const outsourcedOrders = getOutsourcedOrders();
  const activeOrders = orders.filter((o) => o.status !== "Delivered");

  const completedOrdersBase = activeOrders.filter(
    (o) => o.status === "Completed",
  );
  const completedOrdersFiltered = useMemo(() => {
    let list = [...completedOrdersBase].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const q = completedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.clientName.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q),
      );
    }
    if (completedDateFilter) {
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        const dateStr = format(d, "yyyy-MM-dd");
        return dateStr === completedDateFilter;
      });
    }
    return list;
  }, [completedOrdersBase, completedSearch, completedDateFilter]);

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditData({
      clientName: order.clientName,
      productName: order.productName,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      dueDate: order.dueDate,
      paymentMethod: order.paymentMethod,
      advance: order.advance ?? 0,
      vatBalance: order.vatBalance ?? 0,
    });
  };

  const saveEdit = (id: string) => {
    const total = editData.totalAmount ?? 0;
    const advance = editData.advance ?? 0;
    const credit = Math.max(0, total - advance);
    updateOrder(id, { ...editData, advance, credit });
    setEditingId(null);
    setEditData({});
    toast({ title: "Order updated successfully" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeliver = (id: string) => {
    markOrderDelivered(id);
    toast({ title: "Order delivered and recorded in Sales" });
  };

  const handleSubmit = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    const advance = parseFloat(formData.advance) || 0;
    const credit = Math.max(0, total - advance);
    const vatBalance = formData.vatBalance
      ? parseFloat(formData.vatBalance)
      : undefined;
    addOrder({
      clientName: formData.clientName,
      productName: formData.productName,
      quantity: parseInt(formData.quantity),
      dueDate: new Date(formData.dueDate),
      paymentMethod: formData.paymentMethod,
      status: "Pending",
      totalAmount: total,
      advance,
      credit,
      vatBalance,
    });
    toast({ title: "Order created successfully" });
    setIsDialogOpen(false);
    setFormData({
      clientName: "",
      productName: "",
      quantity: "",
      dueDate: "",
      paymentMethod: "Bank",
      totalAmount: "",
      advance: "",
      vatBalance: "",
    });
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    toast({ title: `Order status updated to ${status}` });
  };

  const getStatusType = (status: OrderStatus) => {
    const map: Record<OrderStatus, "success" | "warning" | "info" | "neutral"> =
      {
        Completed: "success",
        "In Progress": "info",
        Pending: "warning",
        Outsourced: "neutral",
        Delivered: "success",
      };
    return map[status];
  };

  const columns: Column<Order>[] = [
    {
      key: "clientName",
      header: "Client",
      className: "font-medium",
      render: (o) =>
        editingId === o.id ? (
          <Input
            value={editData.clientName || ""}
            onChange={(e) =>
              setEditData({ ...editData, clientName: e.target.value })
            }
            className="h-8 w-28"
          />
        ) : (
          o.clientName
        ),
    },
    {
      key: "productName",
      header: "Product",
      render: (o) =>
        editingId === o.id ? (
          <Input
            value={editData.productName || ""}
            onChange={(e) =>
              setEditData({ ...editData, productName: e.target.value })
            }
            className="h-8 w-28"
          />
        ) : (
          o.productName
        ),
    },
    {
      key: "quantity",
      header: "Qty",
      className: "font-mono",
      render: (o) =>
        editingId === o.id ? (
          <Input
            type="number"
            value={editData.quantity || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                quantity: parseInt(e.target.value) || 0,
              })
            }
            className="h-8 w-20"
          />
        ) : (
          o.quantity
        ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (o) =>
        editingId === o.id ? (
          <Input
            type="date"
            value={
              editData.dueDate
                ? format(new Date(editData.dueDate), "yyyy-MM-dd")
                : ""
            }
            onChange={(e) =>
              setEditData({ ...editData, dueDate: new Date(e.target.value) })
            }
            className="h-8 w-36"
          />
        ) : (
          format(new Date(o.dueDate), "MMM dd, yyyy")
        ),
    },
    { key: "paymentMethod", header: "Payment" },
    {
      key: "totalAmount",
      header: "Amount",
      className: "font-mono",
      render: (o) =>
        editingId === o.id ? (
          <Input
            type="number"
            step="0.01"
            value={editData.totalAmount || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                totalAmount: parseFloat(e.target.value) || 0,
              })
            }
            className="h-8 w-24"
          />
        ) : (
          formatCurrency(o.totalAmount)
        ),
    },
    {
      key: "advance" as keyof Order,
      header: "Advance",
      className: "font-mono",
      render: (o) =>
        editingId === o.id ? (
          <Input
            type="number"
            step="0.01"
            value={editData.advance ?? ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                advance: parseFloat(e.target.value) || 0,
              })
            }
            className="h-8 w-24"
          />
        ) : (
          formatCurrency(o.advance ?? 0)
        ),
    },
    {
      key: "vatBalance" as keyof Order,
      header: "VAT Balance",
      className: "font-mono",
      render: (o) =>
        editingId === o.id ? (
          <Input
            type="number"
            step="0.01"
            value={editData.vatBalance ?? ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                vatBalance: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="h-8 w-24"
          />
        ) : (
          formatCurrency(o.vatBalance ?? 0)
        ),
    },
    {
      key: "credit" as keyof Order,
      header: "Credit",
      className: "font-mono",
      render: (o) => {
        const credit =
          editingId === o.id
            ? Math.max(0, (editData.totalAmount ?? 0) - (editData.advance ?? 0))
            : (o.credit ?? Math.max(0, o.totalAmount - (o.advance ?? 0)));
        return formatCurrency(credit);
      },
    },

    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Select
          value={o.status}
          onValueChange={(value: OrderStatus) =>
            requireAuth(() => handleStatusChange(o.id, value))
          }
          disabled={o.status === "Delivered"}
        >
          <SelectTrigger className="w-32 h-8">
            <StatusBadge status={getStatusType(o.status)} label={o.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Outsourced">Outsourced</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "id" as keyof Order,
      header: "Actions",
      render: (o) => {
        if (o.status === "Delivered") return null;
        return (
          <div className="flex items-center gap-1">
            {editingId === o.id ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => requireAuth(() => saveEdit(o.id))}
                >
                  <Check className="w-4 h-4 text-success" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={cancelEdit}
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => requireAuth(() => startEdit(o))}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {o.status === "Completed" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => requireAuth(() => handleDeliver(o.id))}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                Deliver
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const outsourcedColumns: Column<Order>[] = [
    { key: "clientName", header: "Client", className: "font-medium" },
    { key: "productName", header: "Product" },
    { key: "quantity", header: "Qty", className: "font-mono" },
    {
      key: "dueDate",
      header: "Due Date",
      render: (o) => format(new Date(o.dueDate), "MMM dd, yyyy"),
    },
    {
      key: "totalAmount",
      header: "Amount",
      className: "font-mono",
      render: (o) => formatCurrency(o.totalAmount),
    },
    {
      key: "advance",
      header: "Advance",
      className: "font-mono",
      render: (o) => formatCurrency(o.advance ?? 0),
    },
    {
      key: "vatBalance",
      header: "VAT Balance",
      className: "font-mono",
      render: (o) => formatCurrency(o.vatBalance ?? 0),
    },
    {
      key: "credit",
      header: "Credit",
      className: "font-mono",
      render: (o) =>
        formatCurrency(
          o.credit ?? Math.max(0, o.totalAmount - (o.advance ?? 0)),
        ),
    },
  ];

  const totalOrderValue = activeOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0,
  );

  const summaryRow = (
    <TableRow className="summary-row">
      <TableCell className="font-semibold">Total Orders Value</TableCell>
      <TableCell />
      <TableCell className="font-mono">{activeOrders.length} orders</TableCell>
      <TableCell />
      <TableCell />
      <TableCell className="font-mono font-bold">
        {formatCurrency(totalOrderValue)}
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track client orders and outsourcing tasks"
        icon={ClipboardList}
        action={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        }
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full sm:w-auto">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="inprogress">
            In Progress (
            {activeOrders.filter((o) => o.status === "In Progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed (
            {activeOrders.filter((o) => o.status === "Completed").length})
          </TabsTrigger>
          <TabsTrigger value="outsourced" className="flex items-center gap-2 whitespace-nowrap">
            <ExternalLink className="w-4 h-4" />
            Outsourced ({outsourcedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={activeOrders}
            columns={columns}
            summaryRow={summaryRow}
            emptyMessage="No active orders. Create your first order."
          />
        </TabsContent>
        <TabsContent value="inprogress">
          <Card className="border-info/30 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-info">
                In Progress Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={activeOrders.filter((o) => o.status === "In Progress")}
                columns={outsourcedColumns}
                emptyMessage="No in-progress orders"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card className="border-success/30 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search by name..."
                  value={completedSearch}
                  onChange={(e) => setCompletedSearch(e.target.value)}
                  className="h-9 max-w-xs"
                />
                <input
                  type="date"
                  value={completedDateFilter}
                  onChange={(e) => setCompletedDateFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
                {completedDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => setCompletedDateFilter("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <DataTable
                data={completedOrdersFiltered}
                columns={outsourcedColumns}
                emptyMessage={
                  completedSearch || completedDateFilter
                    ? "No matching completed orders"
                    : "No completed orders"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="outsourced">
          <Card className="border-info/30 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-info">
                <ExternalLink className="w-5 h-5" />
                Outsourced Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={outsourcedOrders}
                columns={outsourcedColumns}
                emptyMessage="No outsourced tasks"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Enter the order details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Line 1: Client Name (Full Width) */}
            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="e.g., Fashion Retail Inc."
              />
            </div>
            {/* Line 2: Product Name (Full Width) */}
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) =>
                  setFormData({ ...formData, productName: e.target.value })
                }
                placeholder="e.g., Cotton T-Shirts"
              />
            </div>
            {/* Line 3: Quantity (Full Width) */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="0"
              />
            </div>
            {/* Line 4: Total Amount | VAT Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">Total Amount (NRs)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vatBalance">VAT Balance (NRs)</Label>
                <Input
                  id="vatBalance"
                  type="number"
                  step="0.01"
                  value={formData.vatBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, vatBalance: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            {/* Line 5: Advance | Credit (auto-calculated) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="advance">Advance Payment (NRs)</Label>
                <Input
                  id="advance"
                  type="number"
                  step="0.01"
                  value={formData.advance}
                  onChange={(e) =>
                    setFormData({ ...formData, advance: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="credit">Credit (Remaining Balance)</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  value={Math.max(
                    0,
                    (parseFloat(formData.totalAmount) || 0) -
                      (parseFloat(formData.advance) || 0),
                  ).toFixed(2)}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            {/* Line 6: Due Date | Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: PaymentMethod) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto whitespace-nowrap">Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAuthModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        onSuccess={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />
    </div>
  );
}
