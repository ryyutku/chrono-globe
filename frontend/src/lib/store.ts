import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of a saved clock
export interface Clock {
  id: string;
  sourceZone: string;
  targetZone: string;
}

// Define the store's state and actions
interface ClockStore {
  clocks: Clock[];
  addClock: (sourceZone: string, targetZone: string) => void;
  removeClock: (id: string) => void;
  // ... you can add actions for reordering, updating, etc.
}

export const useClockStore = create<ClockStore>()(
  persist(
    (set, get) => ({
      clocks: [],
      addClock: (sourceZone, targetZone) => {
        const { clocks } = get();
        // Prevent duplicates
        const exists = clocks.some(
          (c) => c.sourceZone === sourceZone && c.targetZone === targetZone
        );
        if (exists) return;

        const newClock: Clock = {
          id: `${sourceZone}-${targetZone}-${Date.now()}`,
          sourceZone,
          targetZone,
        };
        set({ clocks: [...clocks, newClock] });
      },
      removeClock: (id) =>
        set((state) => ({
          clocks: state.clocks.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'world-clock-storage', // Key in localStorage
    }
  )
);