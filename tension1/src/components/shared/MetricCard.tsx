import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "warning" | "success" | "danger";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    warning: "bg-warning/5 border-warning/20",
    success: "bg-success/5 border-success/20",
    danger: "bg-destructive/5 border-destructive/20",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/15 text-destructive",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all hover:shadow-md animate-fade-in overflow-hidden max-w-full",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold font-mono break-words sm:break-normal truncate-sm">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
            iconStyles[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
