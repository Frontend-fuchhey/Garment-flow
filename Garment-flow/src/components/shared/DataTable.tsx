import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  summaryRow?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  summaryRow,
  emptyMessage = "No data available",
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    const keys = (column.key as string).split(".");
    let value: unknown = item;
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key];
    }
    return value as React.ReactNode;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card w-full">
      <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column) => (
              <TableHead
                key={column.key as string}
                className={cn("font-semibold text-foreground", column.className)}
              >
                {column.renderHeader ? column.renderHeader() : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer",
                index % 2 === 0 ? "bg-card" : "bg-muted/30",
                rowClassName?.(item)
              )}
            >
              {columns.map((column) => (
                <TableCell
                  key={`${item.id}-${column.key as string}`}
                  className={column.className}
                >
                  {getCellValue(item, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {summaryRow}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
