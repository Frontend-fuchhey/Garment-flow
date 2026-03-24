import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2 sm:line-clamp-none">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="w-full sm:w-auto shrink-0 [&>button]:w-full [&>button]:sm:w-auto">{action}</div>}
    </div>
  );
}
