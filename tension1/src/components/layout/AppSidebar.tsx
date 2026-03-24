import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Trash2,
  Users,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Factory,
  Database,
  BookOpen,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Daily Register", path: "/register", icon: History },
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Stock", path: "/stock", icon: Package },
  { title: "Purchasing", path: "/purchasing", icon: ShoppingCart },
  { title: "Orders", path: "/orders", icon: ClipboardList },
  { title: "Sales", path: "/sales", icon: DollarSign },
  { title: "Waste", path: "/waste", icon: Trash2 },
  { title: "Payroll", path: "/payroll", icon: Users },
  { title: "Utilization", path: "/utilization", icon: Calculator },
  { title: "Recipes", path: "/recipes", icon: BookOpen },
  { title: "Data Mgmt", path: "/data", icon: Database },
  { title: "Shift Logs", path: "/shifts", icon: History },
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0 print:hidden",
        collapsed ? "w-16" : "w-56 sm:w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
          <Factory className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg text-sidebar-accent-foreground">
              GarmentFlow
            </h1>
            <p className="text-xs text-sidebar-muted">ERP System</p>

            {/*developed by branding*/}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ease-in-out group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors duration-200 ease-in-out",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-muted md:group-hover:text-sidebar-accent-foreground",
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm animate-fade-in">
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center text-sidebar-muted md:hover:text-sidebar-foreground md:hover:bg-sidebar-accent transition-colors duration-200 ease-in-out focus-visible:bg-sidebar-accent focus-visible:text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-foreground"
          skipShiftLock
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
