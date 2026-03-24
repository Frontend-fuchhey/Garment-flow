import { useERPStore } from "@/stores/erpStore";
import { format, isSameDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Printer, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function DailyRegisterPage() {
  const { purchases, sales } = useERPStore();
  const today = new Date();

  // Combine and sort transactions by timestamp descending
  const transactions = [
    ...purchases
      .filter((p) => p.status !== "Merged")
      .map((p) => ({
      id: `p-${p.id}`,
      timestamp: new Date(p.timestamp),
      type: "Purchase" as const,
      party: p.vendorName,
      items: p.materialName,
      quantity: `${p.quantity} ${p.unitType}`,
      amount: p.totalPrice,
      status: "Completed",
    })),
    ...sales.map((s) => ({
      id: `s-${s.id}`,
      timestamp: new Date(s.timestamp),
      type: "Sale" as const,
      party: s.clientName,
      items: s.items.map((i) => i.productName).join(", "),
      quantity: s.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
      amount: s.totalRevenue,
      status: "Completed",
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Single pass calculation for today's summary
  const summary = transactions.reduce(
    (acc, tx) => {
      if (isSameDay(tx.timestamp, today)) {
        if (tx.type === "Sale") {
          acc.earnings += tx.amount;
        } else {
          acc.expenses += tx.amount;
        }
      }
      return acc;
    },
    { earnings: 0, expenses: 0 }
  );

  const netBalance = summary.earnings - summary.expenses;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Daily Register</h1>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Statement
        </Button>
      </div>

      <div className="hidden print:block text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold">Daily Register Statement</h1>
        <p className="text-xl text-muted-foreground">Generated on {format(today, "PPP 'at' pp")}</p>
      </div>

      {/* Billing Analysis Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50/30 print:border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              NRs {summary.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-600/70">Total sales today</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30 print:border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              NRs {summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600/70">Total purchases today</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 print:border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              netBalance >= 0 ? "text-blue-700" : "text-amber-700"
            )}>
              NRs {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-blue-600/70">Daily financial health</p>
          </CardContent>
        </Card>
      </div>

      <Card className="print:shadow-none print:border-none print:w-full">
        <CardHeader className="print:px-0">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="print:px-0">
          <div className="relative overflow-x-auto w-full">
            <Table className="print:w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="print:break-inside-avoid">
                    <TableCell className="whitespace-nowrap">
                      {format(tx.timestamp, "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-semibold print:bg-transparent print:p-0",
                          tx.type === "Purchase"
                            ? "bg-red-100 text-red-700 hover:bg-red-200 print:text-red-700"
                            : "bg-green-100 text-green-700 hover:bg-green-200 print:text-green-700"
                        )}
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.party}</TableCell>
                    <TableCell className="max-w-xs truncate" title={tx.items}>
                      {tx.items}
                    </TableCell>
                    <TableCell>{tx.quantity}</TableCell>
                    <TableCell className="font-medium">
                      NRs {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="print:border-none print:p-0">{tx.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
