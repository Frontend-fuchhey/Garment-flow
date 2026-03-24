import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { useERPStore } from "@/stores/erpStore";
import { Sale, PaymentMethod, SaleItem } from "@/types/erp";
import { DollarSign, Plus, Trash2 } from "lucide-react";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalesPage() {
  const { sales, addSale } = useERPStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", paymentMethod: "Bank" as PaymentMethod });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ productName: "", quantity: 0, pricePerUnit: 0, total: 0 }]);

  const addItem = () => {
    setSaleItems([...saleItems, { productName: "", quantity: 0, pricePerUnit: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const updated = [...saleItems];
    if (field === "productName") {
      updated[index].productName = value as string;
    } else {
      const numValue = parseFloat(value as string) || 0;
      if (field === "quantity") updated[index].quantity = numValue;
      if (field === "pricePerUnit") updated[index].pricePerUnit = numValue;
      updated[index].total = updated[index].quantity * updated[index].pricePerUnit;
    }
    setSaleItems(updated);
  };

  const totalRevenue = saleItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = () => {
    const validItems = saleItems.filter((item) => item.productName && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Add at least one valid item", variant: "destructive" });
      return;
    }

    addSale({
      clientName: formData.clientName,
      items: validItems,
      totalRevenue,
      paymentMethod: formData.paymentMethod,
      timestamp: new Date(),
    });

    toast({ title: "Sale recorded successfully" });
    setIsDialogOpen(false);
    setFormData({ clientName: "", paymentMethod: "Bank" });
    setSaleItems([{ productName: "", quantity: 0, pricePerUnit: 0, total: 0 }]);
  };

  const allTimeSales = sales.reduce((sum, s) => sum + s.totalRevenue, 0);

  const sortedSales = useMemo(
    () =>
      [...sales].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [sales]
  );

  const columns: Column<Sale>[] = [
    { key: "clientName", header: "Client", className: "font-medium" },
    { key: "items", header: "Items", render: (s) => (
      <div className="text-sm">
        {s.items.map((item, i) => (
          <div key={i}>
            {item.productName} x{item.quantity}
          </div>
        ))}
      </div>
    ) },
    { key: "paymentMethod", header: "Payment" },
    { key: "totalRevenue", header: "Revenue", className: "font-mono font-semibold text-success", render: (s) => formatCurrency(s.totalRevenue) },
    { key: "timestamp", header: "Date", render: (s) => format(new Date(s.timestamp), "MMM dd, yyyy") },
  ];

  const summaryRow = (
    <TableRow className="summary-row">
      <TableCell className="font-semibold">Total Sales</TableCell>
      <TableCell />
      <TableCell />
      <TableCell className="font-mono font-bold text-lg text-success">
        {formatCurrency(allTimeSales)}
      </TableCell>
      <TableCell />
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Record completed sales and revenue"
        icon={DollarSign}
        action={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        }
      />

      <DataTable
        data={sortedSales}
        columns={columns}
        summaryRow={summaryRow}
        emptyMessage="No sales recorded yet."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>
              Add sale details with line items.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Line Items</CardTitle>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {saleItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <div className="flex-1 grid gap-1 min-w-0">
                      <Label className="text-xs">Product</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                        placeholder="Product name"
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <div className="w-20 sm:w-20 grid gap-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="w-24 sm:w-24 grid gap-1">
                        <Label className="text-xs">Price/Unit</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.pricePerUnit || ""}
                          onChange={(e) => updateItem(index, "pricePerUnit", e.target.value)}
                        />
                      </div>
                      <div className="w-24 sm:w-24 grid gap-1">
                        <Label className="text-xs">Total</Label>
                        <div className="h-10 px-3 flex items-center bg-muted rounded-md font-mono text-sm">
                          Rs. {item.total.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={saleItems.length === 1}
                        className="shrink-0 self-end sm:self-auto"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold font-mono text-success">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto whitespace-nowrap">Record Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
