// Zustand store for app settings
// This centralizes all app configuration settings

import { create } from 'zustand';

interface SettingsStoreState {
  // Layout settings
  layoutType: number;
  
  // Thought-related settings
  maxThoughtCount: number;
  
  // Audio settings
  microphoneEnabled: boolean;
  
  // Actions
  setLayoutType: (layout: number) => void;
  setMaxThoughtCount: (count: number) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  // Default values
  layoutType: 1,
  maxThoughtCount: 5,
  microphoneEnabled: false,
  
  // Actions to update settings
  setLayoutType: (layout: number) => set({ layoutType: layout }),
  setMaxThoughtCount: (count: number) => set({ maxThoughtCount: count }),
  setMicrophoneEnabled: (enabled: boolean) => set({ microphoneEnabled: enabled }),
})); 