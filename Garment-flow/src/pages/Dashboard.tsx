import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatCurrency, formatCompactCurrency } from "@/lib/currency";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useERPStore } from "@/stores/erpStore";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  Banknote,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, Material, WasteRecord } from "@/types/erp";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { getDashboardMetrics, getLowStockMaterials, orders, sales, wasteRecords, deleteWasteRecord } = useERPStore();
  const metrics = getDashboardMetrics();
  const lowStockMaterials = getLowStockMaterials();
  const recentOrders = orders.slice(0, 5);

  const handleDeleteWaste = (id: string) => {
    deleteWasteRecord(id);
    toast({ title: "Waste record deleted" });
  };


  const orderColumns: Column<Order>[] = [
    { key: "clientName", header: "Client" },
    { key: "productName", header: "Product" },
    {
      key: "quantity",
      header: "Qty",
      className: "font-mono",
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (order) => format(new Date(order.dueDate), "MMM dd, yyyy"),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => {
        const statusMap: Record<Order["status"], "success" | "warning" | "info" | "danger" | "neutral"> = {
          Completed: "success",
          "In Progress": "info",
          Pending: "warning",
          Outsourced: "neutral",
          Delivered: "success",
        };
        return <StatusBadge status={statusMap[order.status] || "neutral"} label={order.status} />;
      },
    },
  ];

  const lowStockColumns: Column<Material>[] = [
    { key: "name", header: "Material" },
    {
      key: "quantity",
      header: "Current Stock",
      className: "font-mono",
      render: (m) => `${m.quantity} ${m.unitType}`,
    },
    {
      key: "lowStockThreshold",
      header: "Threshold",
      className: "font-mono",
      render: (m) => `${m.lowStockThreshold} ${m.unitType}`,
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusBadge status="danger" label="Low Stock" pulse />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your garment manufacturing operations"
        icon={LayoutDashboard}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Materials"
          value={metrics.totalMaterials}
          icon={Package}
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockCount}
          icon={AlertTriangle}
          variant={metrics.lowStockCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Active Orders"
          value={metrics.pendingOrders}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Sales This Month"
          value={formatCompactCurrency(metrics.totalSalesThisMonth)}
          icon={Banknote}
          variant="success"
        />
        <MetricCard
          title="Total Waste"
          value={`${metrics.totalWaste.toFixed(1)}`}
          subtitle="All units"
          icon={Trash2}
          variant="danger"
        />
        <MetricCard
          title="Employees"
          value={metrics.employeeCount}
          icon={Users}
        />
      </div>

      {/* Low Stock Alerts */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <CardTitle className="text-lg text-warning-foreground">Low Stock Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable data={lowStockMaterials} columns={lowStockColumns} />
          </CardContent>
        </Card>
      )}

      {/* Waste Records */}
      {wasteRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Waste Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={wasteRecords}
              columns={[
                { key: "materialName", header: "Material", className: "font-medium" },
                {
                  key: "quantity",
                  header: "Quantity",
                  className: "font-mono",
                  render: (w: WasteRecord) => `${w.quantity.toFixed(2)} ${w.unitType}`,
                },
                { key: "reason", header: "Reason" },
                {
                  key: "timestamp",
                  header: "Date",
                  render: (w: WasteRecord) => format(new Date(w.timestamp), "MMM dd, yyyy"),
                },
                {
                  key: "id",
                  header: "",
                  render: (w: WasteRecord) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWaste(w.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ),
                },
              ] as Column<WasteRecord>[]}
              emptyMessage="No waste records"
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={recentOrders}
            columns={orderColumns}
            emptyMessage="No orders yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
