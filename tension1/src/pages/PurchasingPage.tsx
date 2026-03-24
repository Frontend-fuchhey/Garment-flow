import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { useERPStore } from "@/stores/erpStore";
import { Purchase, UnitType } from "@/types/erp";
import { ShoppingCart, Plus, Pencil, GitMerge } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/hooks/use-toast";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

const emptyForm = {
  materialName: "",
  unitType: "",
  vendorName: "",
  vendorLocation: "",
  quantity: "",
  pricePerUnit: "",
  initialBalance: "",
  finalBalance: "",
};

export default function PurchasingPage() {
  const { purchases, materials, addPurchase, updatePurchase, mergePurchases } = useERPStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const handleSubmit = () => {
    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.pricePerUnit);
    const material = materials.find((m) => m.name === formData.materialName);

    addPurchase({
      materialId: material?.id || "",
      materialName: formData.materialName,
      vendorName: formData.vendorName,
      vendorLocation: formData.vendorLocation,
      quantity,
      unitType: (formData.unitType || "Meter") as UnitType,
      pricePerUnit,
      totalPrice: quantity * pricePerUnit,
      initialBalance: formData.initialBalance
        ? parseFloat(formData.initialBalance)
        : undefined,
      finalBalance: formData.finalBalance
        ? parseFloat(formData.finalBalance)
        : undefined,
      timestamp: new Date(),
    });

    toast({
      title: "Purchase recorded" + (material ? " & stock updated" : ""),
    });
    setIsDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleEditClick = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    requireAuth(() => {
      setFormData({
        materialName: purchase.materialName,
        unitType: purchase.unitType,
        vendorName: purchase.vendorName,
        vendorLocation: purchase.vendorLocation,
        quantity: String(purchase.quantity),
        pricePerUnit: String(purchase.pricePerUnit),
        initialBalance:
          purchase.initialBalance != null
            ? String(purchase.initialBalance)
            : "",
        finalBalance:
          purchase.finalBalance != null ? String(purchase.finalBalance) : "",
      });
      setIsEditDialogOpen(true);
    });
  };

  const handleEditSubmit = () => {
    if (!editingPurchase) return;
    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    updatePurchase(editingPurchase.id, {
      materialName: formData.materialName,
      vendorName: formData.vendorName,
      vendorLocation: formData.vendorLocation,
      quantity,
      unitType: (formData.unitType || "Meter") as UnitType,
      pricePerUnit,
      totalPrice: quantity * pricePerUnit,
      initialBalance: formData.initialBalance
        ? parseFloat(formData.initialBalance)
        : undefined,
      finalBalance: formData.finalBalance
        ? parseFloat(formData.finalBalance)
        : undefined,
    });

    toast({ title: "Purchase updated successfully" });
    setIsEditDialogOpen(false);
    setEditingPurchase(null);
    setFormData(emptyForm);
  };

  const totalSpent = purchases
    .filter((p) => p.status !== "Merged")
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const handleMerge = () => {
    if (selectedIds.length < 2) return;
    requireAuth(() => {
      mergePurchases(selectedIds);
      setSelectedIds([]);
      toast({ title: `Merged ${selectedIds.length} orders into a master order` });
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const columns: Column<Purchase>[] = [
    {
      key: "selection",
      header: "",
      render: (p) => (
        <Checkbox
          checked={selectedIds.includes(p.id)}
          onCheckedChange={() => toggleSelection(p.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-10",
    },
    { key: "materialName", header: "Material", className: "font-medium" },
    { key: "vendorName", header: "Vendor" },
    { key: "vendorLocation", header: "Location" },
    {
      key: "quantity",
      header: "Quantity",
      className: "font-mono",
      render: (p) => `${p.quantity} ${p.unitType}`,
    },
    {
      key: "pricePerUnit",
      header: "Price/Unit",
      className: "font-mono",
      render: (p) => formatCurrency(p.pricePerUnit),
    },
    {
      key: "totalPrice",
      header: "Total",
      className: "font-mono font-semibold",
      render: (p) => formatCurrency(p.totalPrice),
    },
    {
      key: "initialBalance",
      header: "Balance First",
      className: "font-mono",
      render: (p) =>
        p.initialBalance != null ? formatCurrency(p.initialBalance) : "—",
    },
    {
      key: "finalBalance",
      header: "Final Balance",
      className: "font-mono",
      render: (p) =>
        p.finalBalance != null ? formatCurrency(p.finalBalance) : "—",
    },
    {
      key: "timestamp",
      header: "Date",
      render: (p) => format(new Date(p.timestamp), "MMM dd, yyyy"),
    },
    {
      key: "actions" as keyof Purchase,
      header: "",
      render: (p) => (
        <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)}>
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const summaryRow = (
    <TableRow className="summary-row">
      <TableCell />
      <TableCell className="font-semibold">Total Spent</TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell className="font-mono font-bold text-lg">
        {formatCurrency(totalSpent)}
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  );

  const formFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="materialName">Material Name</Label>
          <Input
            id="materialName"
            value={formData.materialName}
            onChange={(e) =>
              setFormData({ ...formData, materialName: e.target.value })
            }
            placeholder="e.g., Cotton Fabric"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unitType">Unit Type</Label>
          <Input
            id="unitType"
            value={formData.unitType}
            onChange={(e) =>
              setFormData({ ...formData, unitType: e.target.value })
            }
            placeholder="e.g., Meter, KG"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="vendorName">Vendor Name</Label>
          <Input
            id="vendorName"
            value={formData.vendorName}
            onChange={(e) =>
              setFormData({ ...formData, vendorName: e.target.value })
            }
            placeholder="e.g., TextileCo"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vendorLocation">Vendor Location</Label>
          <Input
            id="vendorLocation"
            value={formData.vendorLocation}
            onChange={(e) =>
              setFormData({ ...formData, vendorLocation: e.target.value })
            }
            placeholder="e.g., Itahari,Nepal"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid gap-2">
          <Label htmlFor="pricePerUnit">Price per Unit (NRs)</Label>
          <Input
            id="pricePerUnit"
            type="number"
            step="0.01"
            value={formData.pricePerUnit}
            onChange={(e) =>
              setFormData({ ...formData, pricePerUnit: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="initialBalance">Purchase Balance</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            value={formData.initialBalance}
            onChange={(e) =>
              setFormData({ ...formData, initialBalance: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="finalBalance">VAT Balance</Label>
          <Input
            id="finalBalance"
            type="number"
            step="0.01"
            value={formData.finalBalance}
            onChange={(e) =>
              setFormData({ ...formData, finalBalance: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchasing"
        description="Log incoming material purchases"
        icon={ShoppingCart}
        action={
          <div className="flex gap-2">
            {selectedIds.length >= 2 && (
              <Button variant="outline" onClick={handleMerge} className="border-primary text-primary hover:bg-primary/10">
                <GitMerge className="w-4 h-4 mr-2" />
                Merge Selected ({selectedIds.length})
              </Button>
            )}
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Purchase
            </Button>
          </div>
        }
      />

      <DataTable
        data={purchases.filter((p) => p.status !== "Merged")}
        columns={columns}
        summaryRow={summaryRow}
        emptyMessage="No purchases recorded yet."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Purchase</DialogTitle>
            <DialogDescription>
              Log a new material purchase. Stock will be automatically updated.
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.materialName || !formData.quantity}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Record Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>
              Update the purchase record details.
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!formData.materialName || !formData.quantity}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Save Changes
            </Button>
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
