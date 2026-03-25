import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { useERPStore } from "@/stores/erpStore";
import { Sale, PaymentMethod, SaleItem } from "@/types/erp";
import { DollarSign, Plus, Trash2, Link, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer } from "lucide-react";
interface MergedSaleItem {
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

const generateInvoiceNumber = () => `INV-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

export default function SalesPage() {
  const { sales, addSale, groupSales, ungroupSales } = useERPStore();
  const [activeTab, setActiveTab] = useState("non-vat");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    clientName: "", 
    paymentMethod: "Bank" as PaymentMethod,
    isVatInclusive: false,
    vatPercentage: "13"
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ productName: "", quantity: 0, pricePerUnit: 0, total: 0 }]);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [mergedData, setMergedData] = useState<{
    items: MergedSaleItem[];
    subtotal: number;
    vatAmount: number;
    grandTotal: number;
    isVat: boolean;
    clientNames: string[];
    invoiceNumber: string;
    timestamp: Date;
  } | null>(null);

  const getGroupInfo = (groupId?: string) => {
    if (!groupId) return { color: "", name: "" };
    
    // Sort grouped IDs present in the current view to assign consistent "Group X" numbers
    const uniqueGroupIds = Array.from(new Set(sales.filter(s => s.groupId).map(s => s.groupId!)));
    const groupIndex = uniqueGroupIds.indexOf(groupId);
    const groupName = groupIndex !== -1 ? `Group ${groupIndex + 1}` : "Group";
    
    const colors = [
      "bg-blue-50/70 border-l-4 border-l-blue-500",
      "bg-purple-50/70 border-l-4 border-l-purple-500",
      "bg-amber-50/70 border-l-4 border-l-amber-500",
      "bg-rose-50/70 border-l-4 border-l-rose-500",
      "bg-indigo-50/70 border-l-4 border-l-indigo-500",
      "bg-emerald-50/70 border-l-4 border-l-emerald-500",
    ];
    
    return {
      className: colors[Math.abs(groupIndex) % colors.length],
      name: groupName
    };
  };

  const openRecordModal = () => {
    setFormData(prev => ({ ...prev, isVatInclusive: activeTab === "vat" }));
    setIsDialogOpen(true);
  };

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

  const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
  const vatPercentage = parseFloat(formData.vatPercentage) || 0;
  const vatAmount = formData.isVatInclusive ? (subtotal * vatPercentage) / 100 : 0;
  const totalRevenue = subtotal + vatAmount;

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
      vatAmount: formData.isVatInclusive ? vatAmount : undefined,
      isVatInclusive: formData.isVatInclusive,
      paymentMethod: formData.paymentMethod,
      timestamp: new Date(),
    });

    toast({ title: "Sale recorded successfully" });
    setIsDialogOpen(false);
    setFormData({ 
      clientName: "", 
      paymentMethod: "Bank",
      isVatInclusive: false,
      vatPercentage: ""
    });
    setSaleItems([{ productName: "", quantity: 0, pricePerUnit: 0, total: 0 }]);
  };

  const sortedSales = useMemo(
    () =>
      [...sales].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [sales]
  );

  const toggleSelection = (id: string) => {
    setSelectedSaleIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = (salesToToggle: Sale[]) => {
    const allSelected = salesToToggle.every(s => selectedSaleIds.includes(s.id));
    if (allSelected) {
      setSelectedSaleIds(prev => prev.filter(id => !salesToToggle.some(s => s.id === id)));
    } else {
      const newIds = salesToToggle.map(s => s.id).filter(id => !selectedSaleIds.includes(id));
      setSelectedSaleIds(prev => [...prev, ...newIds]);
    }
  };

  const handleGroupPrepared = () => {
    const selectedSales = sales.filter(s => selectedSaleIds.includes(s.id));
    if (selectedSales.length < 2) {
      toast({ title: "Select at least 2 sales to group", variant: "destructive" });
      return;
    }

    // Prevention Choice: Check if any are already in a group
    if (selectedSales.some(s => s.groupId)) {
      toast({ title: "One or more selected sales are already in a group", variant: "destructive" });
      return;
    }

    // Client Name Check: Same client name!
    const clientName = selectedSales[0].clientName;
    if (selectedSales.some(s => s.clientName !== clientName)) {
      toast({ title: "Cannot merge sales from different clients", variant: "destructive" });
      return;
    }

    // Safety check: Don't mix VAT and Non-VAT
    const isVat = selectedSales[0].isVatInclusive;
    if (selectedSales.some(s => s.isVatInclusive !== isVat)) {
      toast({ title: "Cannot group VAT and Non-VAT sales together", variant: "destructive" });
      return;
    }

    groupSales(selectedSaleIds);
    toast({ title: "Sales grouped successfully!", description: "Rows are now independent Print Groups. Access them via the group buttons." });
    setSelectedSaleIds([]);
  };

  const handlePrintGroup = (groupId: string) => {
    const groupSalesData = sales.filter(s => s.groupId === groupId);
    if (groupSalesData.length === 0) return;

    const isVat = groupSalesData[0].isVatInclusive;
    const itemMap = new Map<string, MergedSaleItem>();
    let totalSubtotal = 0;
    let totalVat = 0;

    groupSalesData.forEach(sale => {
      sale.items.forEach(item => {
        const existing = itemMap.get(item.productName);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.total;
          existing.pricePerUnit = existing.total / existing.quantity;
        } else {
          itemMap.set(item.productName, { ...item });
        }
      });
      totalSubtotal += sale.items.reduce((sum, i) => sum + i.total, 0);
      totalVat += sale.vatAmount || 0;
    });

    setMergedData({
      items: Array.from(itemMap.values()),
      subtotal: totalSubtotal,
      vatAmount: totalVat,
      grandTotal: totalSubtotal + totalVat,
      isVat,
      clientNames: Array.from(new Set(groupSalesData.map(s => s.clientName))),
      invoiceNumber: groupSalesData[0].groupInvoiceNumber || "GROUP",
      timestamp: new Date(),
    });

    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const processDisplaySales = (sourceSales: Sale[]) => {
    const result: any[] = [];
    const groups = new Map<string, Sale[]>();
    
    // Process ungrouped first or maintain logical blocks
    const processedGroupIds = new Set<string>();
    
    sourceSales.forEach(sale => {
      if (!sale.groupId) {
        result.push({ ...sale, isGroup: false });
      } else if (!processedGroupIds.has(sale.groupId)) {
        const groupSales = sourceSales.filter(s => s.groupId === sale.groupId);
        
        // Aggregate row (Permanent Collapse)
        result.push({
          id: sale.groupId,
          groupId: sale.groupId,
          isGroup: true,
          sales: groupSales,
          clientName: groupSales[0].clientName, // Mandatory single client
          items: groupSales.flatMap(s => s.items),
          totalRevenue: groupSales.reduce((sum, s) => sum + s.totalRevenue, 0),
          vatAmount: groupSales.reduce((sum, s) => sum + (s.vatAmount || 0), 0),
          isVatInclusive: sale.isVatInclusive,
          paymentMethod: groupSales[0].paymentMethod,
          timestamp: new Date(Math.max(...groupSales.map(s => new Date(s.timestamp).getTime()))),
          groupInvoiceNumber: sale.groupInvoiceNumber,
        });

        processedGroupIds.add(sale.groupId);
      }
    });

    return result;
  };

  const vatSales = processDisplaySales(sortedSales.filter(s => s.isVatInclusive));
  const nonVatSales = processDisplaySales(sortedSales.filter(s => !s.isVatInclusive));

  const totalVatRevenue = sales.filter(s => s.isVatInclusive).reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalNonVatRevenue = sales.filter(s => !s.isVatInclusive).reduce((sum, s) => sum + s.totalRevenue, 0);

  const sharedColumns: Column<any>[] = [
    { key: "clientName", header: "Client", className: "font-medium" },
    { key: "items", header: "Items", render: (s) => {
      const allItems = s.items;
      if (s.isGroup) {
        // Concatenating items for the unified row
        const itemMap = new Map<string, number>();
        allItems.forEach((i: SaleItem) => {
          itemMap.set(i.productName, (itemMap.get(i.productName) || 0) + i.quantity);
        });
        return (
          <div className="text-sm font-medium">
            {Array.from(itemMap.entries()).map(([name, qty]) => `${name} x${qty}`).join(" + ")}
          </div>
        );
      }
      return (
        <div className="text-sm">
          {s.items.map((item: any, i: number) => (
            <div key={i}>
              {item.productName} x{item.quantity}
            </div>
          ))}
        </div>
      );
    }},
    { key: "paymentMethod", header: "Payment", render: (s) => s.isGroup ? "Merged Invoice" : s.paymentMethod },
    { key: "timestamp", header: "Date", render: (s) => format(new Date(s.timestamp), "MMM dd, yyyy") },
    { key: "groupActions", header: "Group Management", className: "w-48", render: (s) => (
      s.groupId && (s.isGroup) ? (
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            Invoice Group
          </div>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] bg-primary/5 hover:bg-primary/10 border-primary/20 rounded-r-none border-r-0"
              onClick={() => handlePrintGroup(s.groupId!)}
            >
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-destructive border border-l-0 border-primary/20 rounded-l-none"
              onClick={() => ungroupSales(s.groupId!)}
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : null
    ) },
  ];

  const vatColumns: Column<any>[] = [
    {
      key: "select",
      header: "",
      className: "w-10",
      render: (s) => (
        <Checkbox
          checked={selectedSaleIds.includes(s.id)}
          onCheckedChange={() => toggleSelection(s.id)}
          disabled={!!s.groupId}
        />
      ),
    },
    ...sharedColumns.slice(0, 2),
    { key: "subtotal", header: "Subtotal", className: "font-mono text-muted-foreground text-xs", render: (s) => formatCurrency(s.totalRevenue - (s.vatAmount || 0)) },
    { key: "vatAmount", header: "VAT Amount", className: "font-mono text-emerald-600 text-xs", render: (s) => `+ ${formatCurrency(s.vatAmount || 0)}` },
    { key: "totalRevenue", header: "Grand Total", className: "font-mono font-bold text-primary", render: (s) => formatCurrency(s.totalRevenue) },
    ...sharedColumns.slice(2),
  ];

  const nonVatColumns: Column<any>[] = [
    {
      key: "select",
      header: "",
      className: "w-10",
      render: (s) => (
        <Checkbox
          checked={selectedSaleIds.includes(s.id)}
          onCheckedChange={() => toggleSelection(s.id)}
          disabled={!!s.groupId}
        />
      ),
    },
    ...sharedColumns.slice(0, 2),
    { key: "totalRevenue", header: "Total Amount", className: "font-mono font-bold text-success", render: (s) => formatCurrency(s.totalRevenue) },
    ...sharedColumns.slice(2),
  ];

  const SelectAllHeader = ({ salesToToggle }: { salesToToggle: any[] }) => (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={
          salesToToggle.length > 0 && 
          salesToToggle.filter(s => !s.groupId).every(s => selectedSaleIds.includes(s.id))
        }
        onCheckedChange={() => toggleAll(salesToToggle.filter(s => !s.groupId))}
      />
    </div>
  );

  const finalVatColumns = [
    { ...vatColumns[0], header: "" as any, renderHeader: () => <SelectAllHeader salesToToggle={vatSales} /> },
    ...vatColumns.slice(1)
  ];

  const finalNonVatColumns = [
    { ...nonVatColumns[0], header: "" as any, renderHeader: () => <SelectAllHeader salesToToggle={nonVatSales} /> },
    ...nonVatColumns.slice(1)
  ];

  const vatSummary = (
    <TableRow className="summary-row bg-emerald-50/50">
      <TableCell className="font-semibold" colSpan={4}>Total VAT Sales</TableCell>
      <TableCell className="font-mono font-bold text-lg text-primary text-right" colSpan={3}>
        {formatCurrency(totalVatRevenue)}
      </TableCell>
    </TableRow>
  );

  const nonVatSummary = (
    <TableRow className="summary-row bg-success/5">
      <TableCell className="font-semibold" colSpan={2}>Total Non-VAT Sales</TableCell>
      <TableCell className="font-mono font-bold text-lg text-success text-right" colSpan={3}>
        {formatCurrency(totalNonVatRevenue)}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Register"
        description="Detailed record of all transactions"
        icon={DollarSign}
        action={
          <Button onClick={openRecordModal}>
            <Plus className="w-4 h-4 mr-2" />
            Record {activeTab === "vat" ? "VAT" : "Non-VAT"} Sale
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="non-vat" className="text-base py-2">Non-VAT Income</TabsTrigger>
          <TabsTrigger value="vat" className="text-base py-2 font-semibold">VAT Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="non-vat" className="space-y-6">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Non-VAT Income</p>
                  <h3 className="text-3xl font-bold text-success">{formatCurrency(totalNonVatRevenue)}</h3>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            data={nonVatSales}
            columns={finalNonVatColumns as any}
            summaryRow={nonVatSummary}
            emptyMessage="No non-VAT sales recorded yet."
            rowClassName={(s) => cn(
              getGroupInfo(s.groupId).className,
              s.isGroup && "font-bold bg-teal-50/40 border-l-8 border-l-teal-500 shadow-sm"
            )}
          />
        </TabsContent>

        <TabsContent value="vat" className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total VAT Revenue</p>
                  <h3 className="text-3xl font-bold text-primary">{formatCurrency(totalVatRevenue)}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            data={vatSales}
            columns={finalVatColumns as any}
            summaryRow={vatSummary}
            emptyMessage="No VAT sales recorded yet."
            rowClassName={(s) => cn(
              getGroupInfo(s.groupId).className,
              s.isGroup && "font-bold bg-teal-50/40 border-l-8 border-l-teal-500 shadow-sm"
            )}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>
              Add sale details with line items.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Tabs 
                  value={formData.isVatInclusive ? "vat" : "non-vat"} 
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 opacity-70 pointer-events-none">
                    <TabsTrigger value="non-vat">Non-VAT</TabsTrigger>
                    <TabsTrigger value="vat">VAT Sale</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

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

                <div className="flex justify-end pt-2 border-t gap-8">
                  {formData.isVatInclusive && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subtotal</p>
                      <p className="text-sm font-semibold font-mono">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>
                  )}
                  {formData.isVatInclusive && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                         <span className="text-[10px] text-muted-foreground uppercase tracking-wider">VAT %</span>
                         <Input 
                            value={formData.vatPercentage}
                            onChange={(e) => setFormData({ ...formData, vatPercentage: e.target.value })}
                            className="h-6 w-12 text-[10px] p-1 text-center"
                            placeholder="13"
                         />
                      </div>
                      <p className="text-sm font-semibold font-mono text-primary">
                        + {formatCurrency(vatAmount)}
                      </p>
                    </div>
                  )}
                  <div className="text-right border-l pl-8">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
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

      {/* Merge Action Bar */}
      {selectedSaleIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {selectedSaleIds.length}
            </span>
            <span className="text-sm font-medium">Sales Selected</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <Button 
            onClick={handleGroupPrepared}
            size="sm"
            title="Group selected sales into a single invoice"
            className="rounded-full shadow-lg shadow-primary/20"
          >
            <Link className="w-4 h-4 mr-2" />
            Group
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedSaleIds([])}
            className="rounded-full"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Hidden Print Template */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 z-[100]">
        {mergedData && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">GARMENT FLOW</h1>
                <p className="text-muted-foreground mt-1">Refined Manufacturing & Sales ERP</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {mergedData.invoiceNumber ? "Tax Invoice" : "Invoice"}
                </h2>
                <p className="text-sm font-medium">{mergedData.invoiceNumber || "Draft"}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(mergedData.timestamp), "MMM dd, yyyy")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billed To:</h3>
                <p className="text-lg font-bold">
                  {mergedData.clientNames.length > 1 
                    ? `Multiple Clients (${mergedData.clientNames.length})` 
                    : mergedData.clientNames[0] || "Cash Client"}
                </p>
                {mergedData.clientNames.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {mergedData.clientNames.join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Sale Type:</h3>
                <p className="text-lg font-bold">{mergedData.isVat ? "VAT INVOICE" : "NON-VAT SALE"}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-foreground/10 text-left">
                  <th className="py-4 font-bold text-sm uppercase tracking-wider">Product Name</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-center">Qty</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-right">Avg Price/Unit</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {mergedData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4 font-semibold">{item.productName}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right font-mono">{formatCurrency(item.pricePerUnit)}</td>
                    <td className="py-4 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-8">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(mergedData.subtotal)}</span>
                </div>
                {mergedData.isVat && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">VAT (13%):</span>
                    <span className="font-mono font-semibold text-emerald-600">+ {formatCurrency(mergedData.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-foreground/10 pt-3">
                  <span className="font-bold">Grand Total:</span>
                  <span className="font-mono text-xl font-black text-primary">{formatCurrency(mergedData.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="pt-24 text-center">
              <div className="border-t border-dashed border-muted-foreground/30 pt-8">
                <p className="text-sm font-medium">Authorized Signature</p>
                <p className="text-[10px] text-muted-foreground mt-4 italic">Thank you for your business!</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
