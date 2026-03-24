import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { useShiftStore, type ShiftLog } from "@/stores/shiftStore";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, History } from "lucide-react";

const formatDuration = (durationMs: number | null) => {
  if (!durationMs || durationMs <= 0) return "-";

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export default function ShiftLogsPage() {
  const { logs } = useShiftStore();

  const columns: Column<ShiftLog>[] = [
    {
      key: "dayNumber",
      header: "Day #",
      className: "font-mono w-24",
    },
    {
      key: "startTime",
      header: "Start Date & Time",
      render: (log) =>
        format(new Date(log.startTime), "MM/dd/yyyy, hh:mm a"),
    },
    {
      key: "endTime",
      header: "End Date & Time",
      render: (log) =>
        log.endTime
          ? format(new Date(log.endTime), "MM/dd/yyyy, hh:mm a")
          : "In progress",
    },
    {
      key: "durationMs",
      header: "Total Duration",
      render: (log) =>
        log.endTime ? formatDuration(log.durationMs) : "In progress",
    },
  ];

  const handleDownloadPdf = () => {
    if (logs.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Shift Logs", 14, 18);
    doc.setFontSize(10);
    doc.text(
      `Generated on ${format(new Date(), "MM/dd/yyyy, hh:mm a")}`,
      14,
      24
    );

    const body = logs.map((log) => [
      `Day ${log.dayNumber}`,
      format(new Date(log.startTime), "MM/dd/yyyy, hh:mm a"),
      log.endTime
        ? format(new Date(log.endTime), "MM/dd/yyyy, hh:mm a")
        : "In progress",
      log.endTime ? formatDuration(log.durationMs) : "In progress",
    ]);

    autoTable(doc, {
      head: [["Day #", "Start", "End", "Total Duration"]],
      body,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [33, 37, 41],
      },
    });

    doc.save("shift-logs.pdf");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Logs"
        description="Track daily start and end times with total duration."
        icon={History}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={logs.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        }
      />

      <DataTable
        data={logs}
        columns={columns}
        emptyMessage="No shifts recorded yet. Use Start Day and End Day to begin tracking."
      />
    </div>
  );
}

