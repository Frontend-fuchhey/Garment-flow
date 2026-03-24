import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  pulse?: boolean;
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        statusStyles[status]
      )}
    >
      {pulse && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse-subtle",
            status === "success" && "bg-success",
            status === "warning" && "bg-warning",
            status === "danger" && "bg-destructive",
            status === "info" && "bg-info",
            status === "neutral" && "bg-muted-foreground"
          )}
        />
      )}
      {label}
    </span>
  );
}
