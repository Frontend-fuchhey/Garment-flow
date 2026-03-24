import { useState, useCallback, useMemo } from "react";
import { Database, Download, Trash2, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useERPStore } from "@/stores/erpStore";
import { useShiftStore } from "@/stores/shiftStore";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAvailableMonths,
  formatMonthYear,
  isInMonth,
  type MonthYear,
} from "@/lib/monthReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";
import type { ShiftLog } from "@/stores/shiftStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const PAGE_MARGIN = 14;
const MAIN_TITLE_FONT = 16;
const SECTION_TITLE_FONT = 12;

function addPageHeader(doc: jsPDF, reportTitle: string, sectionTitle: string) {
  doc.setFontSize(MAIN_TITLE_FONT);
  doc.text(reportTitle, PAGE_MARGIN, 12);
  doc.setFontSize(SECTION_TITLE_FONT);
  doc.text(sectionTitle, PAGE_MARGIN, 20);
}

/** Multi-page PDF: one section per page, main title + section subheader on every page */
function generateMonthlyPDF(
  monthYear: MonthYear,
  store: ReturnType<typeof useERPStore.getState>,
  shiftLogs: ShiftLog[]
) {
  const doc = new jsPDF();
  const reportTitle = `Monthly Operations Report - ${formatMonthYear(monthYear)}`;
  const isIn = (d: Date) => isInMonth(d, monthYear);

  const purchases = store.purchases.filter((p) => isIn(new Date(p.timestamp)));
  const materials = store.materials.filter(
    (m) => isIn(new Date(m.createdAt)) || isIn(new Date(m.updatedAt))
  );
  const orders = store.orders.filter((o) => isIn(new Date(o.createdAt)));
  const payroll = store.payrollRecords.filter((p) => isIn(new Date(p.paidAt)));
  const sales = store.sales.filter((s) => isIn(new Date(s.timestamp)));
  const shifts = shiftLogs.filter((log) => isIn(new Date(log.startTime)));

  // 1. Purchasing
  addPageHeader(doc, reportTitle, "Section: Purchasing Data");
  if (purchases.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Material", "Vendor", "Location", "Qty", "Price/Unit", "Total"]],
      body: purchases.map((p) => [
        p.materialName,
        p.vendorName,
        p.vendorLocation,
        p.quantity.toString(),
        formatCurrency(p.pricePerUnit),
        formatCurrency(p.totalPrice),
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No purchasing records for this month.", PAGE_MARGIN, 26);
  }
  doc.addPage();

  // 2. Stock
  addPageHeader(doc, reportTitle, "Section: Stock Data");
  if (materials.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Name", "Qty", "Unit", "Price/Unit", "Total Value"]],
      body: materials.map((m) => [
        m.name,
        m.quantity.toString(),
        m.unitType,
        formatCurrency(m.pricePerUnit),
        formatCurrency(m.quantity * m.pricePerUnit),
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No stock records for this month.", PAGE_MARGIN, 26);
  }
  doc.addPage();

  // 3. Orders
  addPageHeader(doc, reportTitle, "Section: Orders Data");
  if (orders.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Client", "Product", "Qty", "Status", "Payment", "Amount"]],
      body: orders.map((o) => [
        o.clientName,
        o.productName,
        o.quantity.toString(),
        o.status,
        o.paymentMethod,
        formatCurrency(o.totalAmount),
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No orders for this month.", PAGE_MARGIN, 26);
  }
  doc.addPage();

  // 4. Payroll
  addPageHeader(doc, reportTitle, "Section: Payroll Data");
  if (payroll.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Employee", "Type", "Period", "Net Payable", "Paid At"]],
      body: payroll.map((p) => [
        p.employeeName,
        p.payrollType,
        p.period,
        formatCurrency(p.netPayable),
        new Date(p.paidAt).toLocaleDateString(),
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No payroll records for this month.", PAGE_MARGIN, 26);
  }
  doc.addPage();

  // 5. Sales
  addPageHeader(doc, reportTitle, "Section: Sales Data");
  if (sales.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Client", "Items", "Payment", "Revenue"]],
      body: sales.map((s) => [
        s.clientName,
        s.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
        s.paymentMethod,
        formatCurrency(s.totalRevenue),
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No sales for this month.", PAGE_MARGIN, 26);
  }
  doc.addPage();

  // 6. Shift Logs (last section – no page break after)
  addPageHeader(doc, reportTitle, "Section: Shift Logs Data");
  if (shifts.length > 0) {
    autoTable(doc, {
      startY: 26,
      head: [["Day #", "Start", "End", "Duration (mins)"]],
      body: shifts.map((log) => [
        log.dayNumber.toString(),
        format(new Date(log.startTime), "PPp"),
        log.endTime ? format(new Date(log.endTime), "PPp") : "-",
        log.durationMs != null ? (log.durationMs / 60000).toFixed(1) : "-",
      ]),
    });
  } else {
    doc.setFontSize(10);
    doc.text("No shift logs for this month.", PAGE_MARGIN, 26);
  }

  doc.save(`Monthly_Report_${formatMonthYear(monthYear).replace(/\s/g, "_")}.pdf`);
}

function generatePDF(store: ReturnType<typeof useERPStore.getState>) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(18);
  doc.text("GarmentFlow ERP - Complete Data Report", 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
  y += 10;

  // Materials / Stock
  if (store.materials.length > 0) {
    doc.setFontSize(14);
    doc.text("Stock / Materials", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Name", "Qty", "Unit", "Price/Unit", "Total Value"]],
      body: store.materials.map((m) => [
        m.name,
        m.quantity.toString(),
        m.unitType,
        formatCurrency(m.pricePerUnit),
        formatCurrency(m.quantity * m.pricePerUnit),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Purchases
  if (store.purchases.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Purchases", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Material", "Vendor", "Location", "Qty", "Price/Unit", "Total"]],
      body: store.purchases.map((p) => [
        p.materialName,
        p.vendorName,
        p.vendorLocation,
        p.quantity.toString(),
        formatCurrency(p.pricePerUnit),
        formatCurrency(p.totalPrice),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Orders
  if (store.orders.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Orders", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Client", "Product", "Qty", "Status", "Payment", "Amount"]],
      body: store.orders.map((o) => [
        o.clientName,
        o.productName,
        o.quantity.toString(),
        o.status,
        o.paymentMethod,
        formatCurrency(o.totalAmount),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Sales
  if (store.sales.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Sales", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Client", "Items", "Payment", "Revenue"]],
      body: store.sales.map((s) => [
        s.clientName,
        s.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
        s.paymentMethod,
        formatCurrency(s.totalRevenue),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Waste
  if (store.wasteRecords.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Waste Records", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Material", "Qty", "Unit", "Reason", "Date"]],
      body: store.wasteRecords.map((w) => [
        w.materialName,
        w.quantity.toString(),
        w.unitType,
        w.reason || "-",
        new Date(w.timestamp).toLocaleDateString(),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Payroll
  if (store.payrollRecords.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Payroll Records", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Employee", "Type", "Period", "Net Payable", "Paid At"]],
      body: store.payrollRecords.map((p) => [
        p.employeeName,
        p.payrollType,
        p.period,
        formatCurrency(p.netPayable),
        new Date(p.paidAt).toLocaleDateString(),
      ]),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Employees
  if (store.employees.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text("Employees", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Name", "Role", "Type", "Salary/Rate", "Advance"]],
      body: store.employees.map((e) => [
        e.name,
        e.role,
        e.payrollType,
        e.payrollType === "Monthly"
          ? formatCurrency(e.monthlySalary || 0)
          : `${formatCurrency(e.ratePerPiece || 0)}/pc`,
        formatCurrency(e.advanceTaken),
      ]),
    });
  }

  doc.save("GarmentFlow_Data_Report.pdf");
}

export default function DataManagementPage() {
  const store = useERPStore();
  const shiftLogs = useShiftStore((s) => s.logs);
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthYear | null>(null);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const availableMonths = useMemo(
    () =>
      getAvailableMonths({
        purchaseTimestamps: store.purchases.map((p) => new Date(p.timestamp)),
        orderCreatedAts: store.orders.map((o) => new Date(o.createdAt)),
        saleTimestamps: store.sales.map((s) => new Date(s.timestamp)),
        payrollPaidAts: store.payrollRecords.map((p) => new Date(p.paidAt)),
        materialCreatedAts: store.materials.map((m) => new Date(m.createdAt)),
        materialUpdatedAts: store.materials.map((m) => new Date(m.updatedAt)),
        shiftStartTimes: shiftLogs.map((log) => log.startTime),
      }),
    [
      store.purchases,
      store.orders,
      store.sales,
      store.payrollRecords,
      store.materials,
      shiftLogs,
    ]
  );

  const requireAuth = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsAuthOpen(true);
  }, []);

  const handleDownloadPDF = () => {
    generatePDF(useERPStore.getState());
    toast({ title: "PDF Downloaded", description: "Your data report has been saved." });
  };

  const handleExportMonthlyPDF = (monthYear: MonthYear) => {
    generateMonthlyPDF(monthYear, useERPStore.getState(), useShiftStore.getState().logs);
    toast({
      title: "Monthly PDF Downloaded",
      description: `${formatMonthYear(monthYear)} report has been saved.`,
    });
  };

  const handleDeleteAll = () => {
    useERPStore.setState({
      materials: [],
      purchases: [],
      orders: [],
      sales: [],
      wasteRecords: [],
      employees: [],
      payrollRecords: [],
      // recipes are intentionally preserved during bulk delete
    });
    // Reset day count and force end of active shift so Admin must start "Day 1" fresh
    useShiftStore.setState({
      isDayActive: false,
      currentShiftId: null,
      logs: [],
    });
    setShowDeleteDialog(false);
    toast({
      title: "Operational Data Deleted",
      description: "All records except recipes have been permanently removed. Day count reset to 1.",
      variant: "destructive",
    });
  };

  const totalRecords =
    store.materials.length +
    store.purchases.length +
    store.orders.length +
    store.sales.length +
    store.wasteRecords.length +
    store.employees.length +
    store.payrollRecords.length;

  // Individual month dashboard
  if (selectedMonth) {
    const isIn = (d: Date) => isInMonth(d, selectedMonth);
    const purchases = store.purchases.filter((p) => isIn(new Date(p.timestamp)));
    const materials = store.materials.filter(
      (m) => isIn(new Date(m.createdAt)) || isIn(new Date(m.updatedAt))
    );
    const orders = store.orders.filter((o) => isIn(new Date(o.createdAt)));
    const payroll = store.payrollRecords.filter((p) => isIn(new Date(p.paidAt)));
    const sales = store.sales.filter((s) => isIn(new Date(s.timestamp)));
    const shifts = shiftLogs.filter((log) => isIn(new Date(log.startTime)));

    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(null)} skipShiftLock>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title={`Monthly Report – ${formatMonthYear(selectedMonth)}`}
            description="Data for the selected month across all modules"
            icon={FileText}
          />
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={() => handleExportMonthlyPDF(selectedMonth)} skipShiftLock className="w-full sm:w-auto whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Export {formatMonthYear(selectedMonth)} Report as PDF
          </Button>
        </div>
        <Tabs defaultValue="purchasing" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="purchasing">Purchasing ({purchases.length})</TabsTrigger>
            <TabsTrigger value="stock">Stock ({materials.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="payroll">Payroll ({payroll.length})</TabsTrigger>
            <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
            <TabsTrigger value="shifts">Shift Logs ({shifts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="purchasing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Purchasing Data</CardTitle>
                <CardDescription>Records for {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No purchasing records for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price/Unit</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.materialName}</TableCell>
                          <TableCell>{p.vendorName}</TableCell>
                          <TableCell>{p.vendorLocation}</TableCell>
                          <TableCell>{p.quantity}</TableCell>
                          <TableCell>{formatCurrency(p.pricePerUnit)}</TableCell>
                          <TableCell>{formatCurrency(p.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stock" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Data</CardTitle>
                <CardDescription>Materials created or updated in {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No stock records for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price/Unit</TableHead>
                        <TableHead>Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.name}</TableCell>
                          <TableCell>{m.quantity}</TableCell>
                          <TableCell>{m.unitType}</TableCell>
                          <TableCell>{formatCurrency(m.pricePerUnit)}</TableCell>
                          <TableCell>{formatCurrency(m.quantity * m.pricePerUnit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Data</CardTitle>
                <CardDescription>Orders created in {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.clientName}</TableCell>
                          <TableCell>{o.productName}</TableCell>
                          <TableCell>{o.quantity}</TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell>{o.paymentMethod}</TableCell>
                          <TableCell>{formatCurrency(o.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payroll" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Data</CardTitle>
                <CardDescription>Payments in {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {payroll.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No payroll records for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Net Payable</TableHead>
                        <TableHead>Paid At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.employeeName}</TableCell>
                          <TableCell>{p.payrollType}</TableCell>
                          <TableCell>{p.period}</TableCell>
                          <TableCell>{formatCurrency(p.netPayable)}</TableCell>
                          <TableCell>{format(new Date(p.paidAt), "PP")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Data</CardTitle>
                <CardDescription>Sales in {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No sales for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.clientName}</TableCell>
                          <TableCell>
                            {s.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
                          </TableCell>
                          <TableCell>{s.paymentMethod}</TableCell>
                          <TableCell>{formatCurrency(s.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shifts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Shift Logs Data</CardTitle>
                <CardDescription>Shifts started in {formatMonthYear(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent>
                {shifts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No shift logs for this month.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day #</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Duration (mins)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.dayNumber}</TableCell>
                          <TableCell>{format(new Date(log.startTime), "PPp")}</TableCell>
                          <TableCell>
                            {log.endTime ? format(new Date(log.endTime), "PPp") : "-"}
                          </TableCell>
                          <TableCell>
                            {log.durationMs != null ? (log.durationMs / 60000).toFixed(1) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Data Management"
        description="Export your data as PDF or reset everything"
        icon={Database}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Download PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Data as PDF
            </CardTitle>
            <CardDescription>
              Download a complete report of all your data including stock, purchases, orders, sales, waste, payroll, and employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Total records: <span className="font-semibold text-foreground">{totalRecords}</span>
            </p>
            <Button onClick={handleDownloadPDF} disabled={totalRecords === 0} skipShiftLock className="w-full sm:w-auto whitespace-nowrap">
              <Download className="w-4 h-4 mr-2 shrink-0" />
              Download PDF Report
            </Button>
          </CardContent>
        </Card>

        {/* Delete All */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete All Data
            </CardTitle>
            <CardDescription>
              Permanently remove all stored data. This action cannot be undone. Consider downloading a PDF backup first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              This will delete {totalRecords} records across all modules.
            </div>
            <Button
              variant="destructive"
              onClick={() => requireAuth(() => setShowDeleteDialog(true))}
              disabled={totalRecords === 0}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 mr-2 shrink-0" />
              Delete Everything
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* View Monthly Reports */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            View Monthly Reports
          </CardTitle>
          <CardDescription>
            Select a month to view aggregated data from Purchasing, Stock, Orders, Payroll, Sales, and Shift Logs. Export as a multi-page PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No monthly data yet. Add records in Purchasing, Orders, Sales, Payroll, or Shift Logs to see months here.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {availableMonths.map((my) => (
                <Button
                  key={`${my.year}-${my.month}`}
                  variant="outline"
                  className="justify-start"
                  onClick={() => setSelectedMonth(my)}
                  skipShiftLock
                >
                  {formatMonthYear(my)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {totalRecords} records including materials, purchases, orders, sales, waste logs, employees, and payroll records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActionAuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} onSuccess={() => { pendingAction?.(); setPendingAction(null); }} />
    </div>
  );
}
