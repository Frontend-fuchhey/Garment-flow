import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useShiftStore } from "@/stores/shiftStore";
import { Button } from "@/components/ui/button";
import { ActionAuthModal } from "@/components/shared/ActionAuthModal";
import { PauseCircle, PlayCircle } from "lucide-react";

export function MainLayout() {
  const { isDayActive, logs, startDay, endDay } = useShiftStore();
  const [isStartDayAuthOpen, setIsStartDayAuthOpen] = useState(false);
  const [isEndDayAuthOpen, setIsEndDayAuthOpen] = useState(false);

  const latestDayNumber =
    logs.length > 0 ? Math.max(...logs.map((log) => log.dayNumber)) : null;

  const handleStartDayClick = () => {
    setIsStartDayAuthOpen(true);
  };

  const handleStartDayAuthSuccess = () => {
    startDay();
  };

  const handleEndDayClick = () => {
    setIsEndDayAuthOpen(true);
  };

  const handleEndDayAuthSuccess = () => {
    endDay();
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto flex flex-col print:overflow-visible">
        <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-3 flex-wrap print:hidden">
          <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
            {isDayActive ? (
              <span className="font-medium whitespace-nowrap">Day is Active</span>
            ) : (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30 whitespace-nowrap">
                Read-Only: Day Not Started
              </span>
            )}
            {latestDayNumber !== null && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground whitespace-nowrap">
                Day {latestDayNumber}
              </span>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isDayActive ? (
              <Button size="sm" variant="destructive" onClick={handleEndDayClick} skipShiftLock className="flex-1 sm:flex-initial whitespace-nowrap min-w-0">
                <PauseCircle className="w-4 h-4 mr-2 shrink-0" />
                End Day
              </Button>
            ) : (
              <Button size="sm" variant="default" onClick={handleStartDayClick} skipShiftLock className="flex-1 sm:flex-initial whitespace-nowrap min-w-0">
                <PlayCircle className="w-4 h-4 mr-2 shrink-0" />
                Start Day
              </Button>
            )}
          </div>
        </div>
        <div className="relative flex-1 min-w-0 print:static">
          <div className="container py-4 px-4 sm:py-6 sm:px-6 lg:px-8 max-w-7xl print:p-0 print:m-0 print:max-w-none">
            <Outlet />
          </div>
        </div>
      </main>

      <ActionAuthModal
        open={isStartDayAuthOpen}
        onOpenChange={setIsStartDayAuthOpen}
        onSuccess={handleStartDayAuthSuccess}
        title="Start Day"
        description="Enter admin credentials to start the day and enable editing."
      />
      <ActionAuthModal
        open={isEndDayAuthOpen}
        onOpenChange={setIsEndDayAuthOpen}
        onSuccess={handleEndDayAuthSuccess}
        title="End Day"
        description="Enter admin credentials to end the day and switch to read-only mode."
      />
    </div>
  );
}
