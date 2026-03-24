import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useERPStore } from "@/stores/erpStore";
import { Material, UnitType } from "@/types/erp";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
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
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

export default function StockPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useERPStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unitType: "Meter" as UnitType,
    pricePerUnit: "",
    lowStockThreshold: "",
  });

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        quantity: material.quantity.toString(),
        unitType: material.unitType,
        pricePerUnit: material.pricePerUnit.toString(),
        lowStockThreshold: material.lowStockThreshold.toString(),
      });
    } else {
      setEditingMaterial(null);
      setFormData({ name: "", quantity: "", unitType: "Meter", pricePerUnit: "", lowStockThreshold: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      unitType: formData.unitType,
      pricePerUnit: parseFloat(formData.pricePerUnit),
      lowStockThreshold: parseFloat(formData.lowStockThreshold),
    };

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, data);
      toast({ title: "Material updated successfully" });
    } else {
      addMaterial(data);
      toast({ title: "Material added successfully" });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    toast({ title: "Material deleted", variant: "destructive" });
  };

  const totalValue = materials.reduce((sum, m) => sum + m.quantity * m.pricePerUnit, 0);

  const columns: Column<Material>[] = [
    { key: "name", header: "Material Name", className: "font-medium" },
    {
      key: "quantity", header: "Quantity", className: "font-mono",
      render: (m) => `${m.quantity.toFixed(2)} ${m.unitType}`,
    },
    {
      key: "pricePerUnit", header: "Price/Unit", className: "font-mono",
      render: (m) => `${formatCurrency(m.pricePerUnit)}/${m.unitType}`,
    },
    {
      key: "totalValue", header: "Total Value", className: "font-mono",
      render: (m) => formatCurrency(m.quantity * m.pricePerUnit),
    },
    {
      key: "status", header: "Status",
      render: (m) => {
        const isLow = m.quantity <= m.lowStockThreshold;
        return <StatusBadge status={isLow ? "danger" : "success"} label={isLow ? "Low Stock" : "In Stock"} pulse={isLow} />;
      },
    },
    {
      key: "actions", header: "Actions",
      render: (m) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); requireAuth(() => handleOpenDialog(m)); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); requireAuth(() => handleDelete(m.id)); }}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const summaryRow = (
    <TableRow className="summary-row">
      <TableCell className="font-semibold">Total</TableCell>
      <TableCell className="font-mono">{materials.length} items</TableCell>
      <TableCell />
      <TableCell className="font-mono font-semibold">{formatCurrency(totalValue)}</TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description="Manage raw materials inventory"
        icon={Package}
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        }
      />

      <DataTable data={materials} columns={columns} summaryRow={summaryRow} emptyMessage="No materials in stock. Add your first material." />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
            <DialogDescription>{editingMaterial ? "Update the material details below." : "Enter the details for the new material."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Material Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Cotton Fabric" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitType">Unit Type</Label>
                <Input id="unitType" value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value as UnitType })} placeholder="e.g., Meter, KG, Piece" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pricePerUnit">Price per Unit (NRs)</Label>
                <Input id="pricePerUnit" type="number" step="0.01" value={formData.pricePerUnit} onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input id="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto whitespace-nowrap">{editingMaterial ? "Update" : "Add"} Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} onSuccess={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}
