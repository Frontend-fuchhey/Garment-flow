import { useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useERPStore } from "@/stores/erpStore";
import { Employee, PayrollType, PayrollRecord } from "@/types/erp";
import { Users, Plus, Calculator, Wallet, Search, Upload, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";

function EmployeeAvatar({ employee, size = "md" }: { employee: Employee; size?: "sm" | "md" }) {
  const { updateEmployee } = useERPStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-12 w-12";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", description: "Max 2MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => { updateEmployee(employee.id, { avatarUrl: reader.result as string }); toast({ title: "Photo updated" }); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEmployee(employee.id, { avatarUrl: undefined });
    toast({ title: "Photo removed" });
  };

  const initials = employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="group relative inline-flex items-center">
      <Avatar className={sizeClass}>
        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>
      {size === "md" && (
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-background/80 p-1 hover:bg-background shadow-sm" title="Upload photo"><Upload className="w-3 h-3 text-foreground" /></button>
          {employee.avatarUrl && (<button onClick={handleRemove} className="rounded-full bg-background/80 p-1 hover:bg-destructive/20 shadow-sm" title="Remove photo"><Trash2 className="w-3 h-3 text-destructive" /></button>)}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}

export default function PayrollPage() {
  const { employees, payrollRecords, addEmployee, recordAdvance, processPayroll } = useERPStore();
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [employeeForm, setEmployeeForm] = useState({
    name: "", role: "", payrollType: "Monthly" as PayrollType, monthlySalary: "", ratePerPiece: "",
  });
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [pieceRateForm, setPieceRateForm] = useState({ quantityProduced: "" });

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const filteredEmployees = employees.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddEmployee = () => {
    addEmployee({
      name: employeeForm.name, role: employeeForm.role, payrollType: employeeForm.payrollType,
      monthlySalary: employeeForm.payrollType === "Monthly" ? parseFloat(employeeForm.monthlySalary) : undefined,
      ratePerPiece: employeeForm.payrollType === "PieceRate" ? parseFloat(employeeForm.ratePerPiece) : undefined,
    });
    toast({ title: "Employee added successfully" });
    setIsEmployeeDialogOpen(false);
    setEmployeeForm({ name: "", role: "", payrollType: "Monthly", monthlySalary: "", ratePerPiece: "" });
  };

  const handleRecordAdvance = () => {
    if (selectedEmployee) {
      recordAdvance(selectedEmployee.id, parseFloat(advanceAmount));
      toast({ title: "Advance recorded" });
      setIsAdvanceDialogOpen(false);
      setAdvanceAmount("");
      setSelectedEmployee(null);
    }
  };

  const handleProcessPayroll = () => {
    if (!selectedEmployee) return;
    let netPayable = 0;
    const record: Omit<PayrollRecord, "id"> = {
      employeeId: selectedEmployee.id, employeeName: selectedEmployee.name,
      payrollType: selectedEmployee.payrollType, period: format(new Date(), "MMMM yyyy"),
      paidAt: new Date(), netPayable: 0,
    };
    if (selectedEmployee.payrollType === "Monthly") {
      const baseSalary = selectedEmployee.monthlySalary || 0;
      netPayable = baseSalary - selectedEmployee.advanceTaken;
      record.baseSalary = baseSalary;
      record.advanceDeducted = selectedEmployee.advanceTaken;
    } else {
      const quantity = parseFloat(pieceRateForm.quantityProduced) || 0;
      const rate = selectedEmployee.ratePerPiece || 0;
      netPayable = quantity * rate;
      record.quantityProduced = quantity;
      record.ratePerPiece = rate;
    }
    record.netPayable = netPayable;
    processPayroll(record);
    toast({ title: `Payroll processed: ${formatCurrency(netPayable)}` });
    setIsPayrollDialogOpen(false);
    setPieceRateForm({ quantityProduced: "" });
    setSelectedEmployee(null);
  };

  const employeeColumns: Column<Employee>[] = [
    { key: "avatar", header: "", className: "w-14", render: (e) => <EmployeeAvatar employee={e} size="md" /> },
    { key: "name", header: "Name", className: "font-medium" },
    { key: "role", header: "Role" },
    { key: "payrollType", header: "Pay Type", render: (e) => <StatusBadge status={e.payrollType === "Monthly" ? "info" : "success"} label={e.payrollType === "Monthly" ? "Monthly" : "Piece Rate"} /> },
    { key: "rate", header: "Rate", className: "font-mono", render: (e) => e.payrollType === "Monthly" ? `${formatCurrency(e.monthlySalary || 0)}/mo` : `${formatCurrency(e.ratePerPiece || 0)}/pc` },
    { key: "advanceTaken", header: "Advance", className: "font-mono", render: (e) => <span className={e.advanceTaken > 0 ? "text-warning" : ""}>{formatCurrency(e.advanceTaken)}</span> },
    { key: "netPayable", header: "Net Payable", className: "font-mono font-semibold", render: (e) => e.payrollType === "Monthly" ? formatCurrency((e.monthlySalary || 0) - e.advanceTaken) : "Per production" },
    {
      key: "actions", header: "Actions",
      render: (e) => {
        const isPaidThisMonth = e.lastPaymentAt ? (() => { const paid = new Date(e.lastPaymentAt); const now = new Date(); return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear(); })() : false;
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => requireAuth(() => { setSelectedEmployee(e); setIsAdvanceDialogOpen(true); })}>
              <Wallet className="w-3 h-3 mr-1" />Advance
            </Button>
            {isPaidThisMonth ? (
              <div className="flex flex-col items-start gap-0.5">
                <Button size="sm" variant="outline" disabled className="border-success/50 text-success pointer-events-none"><Check className="w-3 h-3 mr-1" />Paid</Button>
                <span className="text-[10px] text-muted-foreground leading-tight">Paid on: {format(new Date(e.lastPaymentAt!), "MMM dd, h:mm a")}</span>
              </div>
            ) : (
              <Button size="sm" onClick={() => requireAuth(() => { setSelectedEmployee(e); setIsPayrollDialogOpen(true); })}>
                <Calculator className="w-3 h-3 mr-1" />Pay Now
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const payrollColumns: Column<PayrollRecord>[] = [
    { key: "employeeName", header: "Employee", className: "font-medium" },
    { key: "period", header: "Period" },
    { key: "payrollType", header: "Type", render: (r) => <StatusBadge status={r.payrollType === "Monthly" ? "info" : "success"} label={r.payrollType} /> },
    { key: "calculation", header: "Calculation", className: "font-mono text-sm", render: (r) => r.payrollType === "Monthly" ? <span>{formatCurrency(r.baseSalary || 0)} - {formatCurrency(r.advanceDeducted || 0)}</span> : <span>{r.quantityProduced} pcs × {formatCurrency(r.ratePerPiece || 0)}</span> },
    { key: "netPayable", header: "Net Paid", className: "font-mono font-semibold text-success", render: (r) => formatCurrency(r.netPayable) },
    { key: "paidAt", header: "Date", render: (r) => format(new Date(r.paidAt), "MMM dd, yyyy") },
  ];

  const totalPayroll = payrollRecords.reduce((sum, r) => sum + r.netPayable, 0);
  const payrollSummaryRow = (
    <TableRow className="summary-row">
      <TableCell className="font-semibold">Total Paid</TableCell><TableCell /><TableCell /><TableCell />
      <TableCell className="font-mono font-bold text-lg text-success">{formatCurrency(totalPayroll)}</TableCell><TableCell />
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll Management" description="Dual-mode payroll: Monthly salary or piece-rate" icon={Users}
        action={<Button onClick={() => setIsEmployeeDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Employee</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-info/5 border-info/20"><CardHeader className="pb-2"><CardTitle className="text-sm text-info flex items-center gap-2"><Calculator className="w-4 h-4" />Monthly Salary Formula</CardTitle></CardHeader><CardContent><p className="font-mono text-lg">Net Payable = Base Salary − Advance Taken</p></CardContent></Card>
        <Card className="bg-success/5 border-success/20"><CardHeader className="pb-2"><CardTitle className="text-sm text-success flex items-center gap-2"><Calculator className="w-4 h-4" />Piece-Rate Formula</CardTitle></CardHeader><CardContent><p className="font-mono text-lg">Total Pay = Quantity × Rate/Piece</p></CardContent></Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList><TabsTrigger value="employees">Employees</TabsTrigger><TabsTrigger value="history">Payroll History</TabsTrigger></TabsList>
        <TabsContent value="employees" className="space-y-4">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
          <DataTable data={filteredEmployees} columns={employeeColumns} emptyMessage={searchQuery ? "No employees match your search." : "No employees yet. Add your first employee."} />
        </TabsContent>
        <TabsContent value="history"><DataTable data={payrollRecords} columns={payrollColumns} summaryRow={payrollSummaryRow} emptyMessage="No payroll records yet." /></TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle><DialogDescription>Enter employee details and select payment type.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} placeholder="e.g., John Doe" /></div>
              <div className="grid gap-2"><Label htmlFor="role">Role</Label><Input id="role" value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })} placeholder="e.g., Senior Tailor" /></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="payrollType">Payment Type</Label>
              <Select value={employeeForm.payrollType} onValueChange={(value: PayrollType) => setEmployeeForm({ ...employeeForm, payrollType: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Monthly">Monthly Salary</SelectItem><SelectItem value="PieceRate">Piece Rate</SelectItem></SelectContent>
              </Select>
            </div>
            {employeeForm.payrollType === "Monthly" ? (
              <div className="grid gap-2"><Label htmlFor="monthlySalary">Monthly Salary (NRs)</Label><Input id="monthlySalary" type="number" value={employeeForm.monthlySalary} onChange={(e) => setEmployeeForm({ ...employeeForm, monthlySalary: e.target.value })} placeholder="0.00" /></div>
            ) : (
              <div className="grid gap-2"><Label htmlFor="ratePerPiece">Rate per Piece (NRs)</Label><Input id="ratePerPiece" type="number" step="0.01" value={employeeForm.ratePerPiece} onChange={(e) => setEmployeeForm({ ...employeeForm, ratePerPiece: e.target.value })} placeholder="0.00" /></div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>Cancel</Button><Button onClick={handleAddEmployee}>Add Employee</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Advance Dialog */}
      <Dialog open={isAdvanceDialogOpen} onOpenChange={setIsAdvanceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Advance</DialogTitle><DialogDescription>Record advance salary for {selectedEmployee?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Current Advance Balance</Label><p className="text-2xl font-mono font-bold text-warning">{formatCurrency(selectedEmployee?.advanceTaken || 0)}</p></div>
            <div className="grid gap-2"><Label htmlFor="advanceAmount">New Advance Amount (NRs)</Label><Input id="advanceAmount" type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="0.00" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAdvanceDialogOpen(false)}>Cancel</Button><Button onClick={handleRecordAdvance}>Record Advance</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payroll</DialogTitle><DialogDescription>Calculate and process payment for {selectedEmployee?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedEmployee?.payrollType === "Monthly" ? (
              <Card className="bg-muted/50"><CardContent className="p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Base Salary</span><span className="font-mono">{formatCurrency(selectedEmployee.monthlySalary || 0)}</span></div>
                <div className="flex justify-between text-warning"><span>Advance Deduction</span><span className="font-mono">−{formatCurrency(selectedEmployee.advanceTaken)}</span></div>
                <div className="border-t pt-2 flex justify-between text-lg font-semibold"><span>Net Payable</span><span className="font-mono text-success">{formatCurrency((selectedEmployee.monthlySalary || 0) - selectedEmployee.advanceTaken)}</span></div>
              </CardContent></Card>
            ) : (
              <>
                <div className="grid gap-2"><Label htmlFor="quantityProduced">Quantity Produced</Label><Input id="quantityProduced" type="number" value={pieceRateForm.quantityProduced} onChange={(e) => setPieceRateForm({ quantityProduced: e.target.value })} placeholder="e.g., 50" /></div>
                <Card className="bg-muted/50"><CardContent className="p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-mono">{pieceRateForm.quantityProduced || 0} pieces</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate per Piece</span><span className="font-mono">{formatCurrency(selectedEmployee?.ratePerPiece || 0)}</span></div>
                  <div className="border-t pt-2 flex justify-between text-lg font-semibold"><span>Total Pay</span><span className="font-mono text-success">{formatCurrency((parseFloat(pieceRateForm.quantityProduced) || 0) * (selectedEmployee?.ratePerPiece || 0))}</span></div>
                </CardContent></Card>
              </>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsPayrollDialogOpen(false)}>Cancel</Button><Button onClick={handleProcessPayroll}>Process Payment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} onSuccess={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}
