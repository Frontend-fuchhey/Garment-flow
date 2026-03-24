import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShiftLog {
  id: string;
  dayNumber: number;
  startTime: string; // ISO string
  endTime: string | null;
  durationMs: number | null;
}

interface ShiftState {
  isDayActive: boolean;
  currentShiftId: string | null;
  logs: ShiftLog[];
  startDay: () => void;
  endDay: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      isDayActive: false,
      currentShiftId: null,
      logs: [],

      startDay: () => {
        const state = get();
        if (state.isDayActive) return;

        const nextDayNumber =
          state.logs.length > 0
            ? Math.max(...state.logs.map((log) => log.dayNumber)) + 1
            : 1;

        const id = generateId();
        const now = new Date().toISOString();

        set({
          isDayActive: true,
          currentShiftId: id,
          logs: [
            ...state.logs,
            {
              id,
              dayNumber: nextDayNumber,
              startTime: now,
              endTime: null,
              durationMs: null,
            },
          ],
        });
      },

      endDay: () => {
        const state = get();
        if (!state.isDayActive || !state.currentShiftId) return;

        const nowIso = new Date().toISOString();

        set({
          isDayActive: false,
          currentShiftId: null,
          logs: state.logs.map((log) =>
            log.id === state.currentShiftId
              ? {
                  ...log,
                  endTime: nowIso,
                  durationMs:
                    new Date(nowIso).getTime() -
                    new Date(log.startTime).getTime(),
                }
              : log
          ),
        });
      },
    }),
    {
      name: "garment-erp-shifts",
    }
  )
);

