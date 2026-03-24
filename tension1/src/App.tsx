import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/stores/authStore";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import StockPage from "@/pages/StockPage";
import PurchasingPage from "@/pages/PurchasingPage";
import OrdersPage from "@/pages/OrdersPage";
import SalesPage from "@/pages/SalesPage";
import WastePage from "@/pages/WastePage";
import PayrollPage from "@/pages/PayrollPage";
import UtilizationPage from "@/pages/UtilizationPage";
import RecipesPage from "@/pages/RecipesPage";
import DataManagementPage from "@/pages/DataManagementPage";
import ShiftLogsPage from "@/pages/ShiftLogsPage";
import DailyRegisterPage from "@/pages/DailyRegisterPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/purchasing" element={<PurchasingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/waste" element={<WastePage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/utilization" element={<UtilizationPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/data" element={<DataManagementPage />} />
        <Route path="/shifts" element={<ShiftLogsPage />} />
        <Route path="/register" element={<DailyRegisterPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
