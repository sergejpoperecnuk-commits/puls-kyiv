import { create } from "zustand";
import { persist } from "zustand/middleware";

type PrefsState = {
  compact: boolean;
  sound: boolean;
  mutedIds: string[];
  setCompact: (value: boolean) => void;
  setSound: (value: boolean) => void;
  toggleMuted: (id: string) => void;
  setMutedIds: (ids: string[]) => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      compact: false,
      sound: false,
      mutedIds: [],
      setCompact: (compact) => set({ compact }),
      setSound: (sound) => set({ sound }),
      toggleMuted: (id) => {
        const mutedIds = get().mutedIds.includes(id)
          ? get().mutedIds.filter((item) => item !== id)
          : [...get().mutedIds, id];
        set({ mutedIds });
      },
      setMutedIds: (mutedIds) => set({ mutedIds }),
    }),
    { name: "kyiv-pulse-prefs" },
  ),
);
