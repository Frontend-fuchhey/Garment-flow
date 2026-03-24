import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useERPStore } from "@/stores/erpStore";
import { WasteRecord, UnitType } from "@/types/erp";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

export default function WastePage() {
  const { wasteRecords, addWasteRecord, deleteWasteRecord, materials, adjustStock } = useERPStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ materialName: "", quantity: "", unitType: "Meter" as UnitType, reason: "" });

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const handleSubmit = () => {
    const quantity = parseFloat(formData.quantity);
    addWasteRecord({ materialName: formData.materialName, quantity, unitType: formData.unitType, reason: formData.reason, timestamp: new Date() });
    const material = materials.find((m) => m.name === formData.materialName);
    if (material) adjustStock(material.id, -quantity);
    toast({ title: "Waste recorded" });
    setIsDialogOpen(false);
    setFormData({ materialName: "", quantity: "", unitType: "Meter", reason: "" });
  };

  const wasteByKg = wasteRecords.filter((w) => w.unitType === "KG").reduce((sum, w) => sum + w.quantity, 0);
  const wasteByMeter = wasteRecords.filter((w) => w.unitType === "Meter").reduce((sum, w) => sum + w.quantity, 0);

  const handleDeleteWaste = (id: string) => {
    deleteWasteRecord(id);
    toast({ title: "Waste record deleted" });
  };

  const columns: Column<WasteRecord>[] = [
    { key: "materialName", header: "Material", className: "font-medium" },
    { key: "quantity", header: "Quantity", className: "font-mono", render: (w) => `${w.quantity.toFixed(2)} ${w.unitType}` },
    { key: "reason", header: "Reason" },
    { key: "timestamp", header: "Date", render: (w) => format(new Date(w.timestamp), "MMM dd, yyyy HH:mm") },
    {
      key: "id", header: "",
      render: (w) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); requireAuth(() => handleDeleteWaste(w.id)); }}>
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const summaryRow = (
    <TableRow className="summary-row">
      <TableCell className="font-semibold">Total Waste</TableCell>
      <TableCell className="font-mono">
        {wasteByMeter > 0 && <span className="block">{wasteByMeter.toFixed(2)} Meter</span>}
        {wasteByKg > 0 && <span className="block">{wasteByKg.toFixed(2)} KG</span>}
      </TableCell>
      <TableCell /><TableCell /><TableCell />
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Waste Management" description="Track post-production scrap and waste materials" icon={Trash2}
        action={<Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Record Waste</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Meter Waste</p><p className="text-2xl font-bold font-mono text-destructive">{wasteByMeter.toFixed(2)} m</p></div><Trash2 className="w-8 h-8 text-destructive/50" /></div></CardContent></Card>
        <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total KG Waste</p><p className="text-2xl font-bold font-mono text-destructive">{wasteByKg.toFixed(2)} kg</p></div><Trash2 className="w-8 h-8 text-destructive/50" /></div></CardContent></Card>
      </div>

      <DataTable data={wasteRecords} columns={columns} summaryRow={summaryRow} emptyMessage="No waste records yet." />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Waste</DialogTitle><DialogDescription>Log post-production scrap or waste material. Stock will be auto-deducted if material exists.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="materialName">Material Name</Label><Input id="materialName" value={formData.materialName} onChange={(e) => setFormData({ ...formData, materialName: e.target.value })} placeholder="Enter material name" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="0.00" /></div>
              <div className="grid gap-2"><Label htmlFor="unitType">Unit Type</Label>
                <Select value={formData.unitType} onValueChange={(value: UnitType) => setFormData({ ...formData, unitType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Meter">Meter</SelectItem><SelectItem value="KG">KG</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label htmlFor="reason">Reason (Optional)</Label><Textarea id="reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Cutting waste, Defective batch" rows={2} /></div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2"><Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button><Button onClick={handleSubmit} variant="destructive" className="w-full sm:w-auto whitespace-nowrap">Record Waste</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} onSuccess={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}
