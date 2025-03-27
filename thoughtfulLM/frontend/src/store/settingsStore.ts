// Zustand store for app settings
// This centralizes all app configuration settings

import { create } from 'zustand';

interface SettingsStoreState {
  // Interface settings
  interfaceType: number;
  
  // Thought-related settings
  maxThoughtCount: number;
  decay: number;
  likeAmount: number;
  
  // Audio settings
  microphoneEnabled: boolean;
  
  // Actions
  setInterfaceType: (interfaceType: number) => void;
  setMaxThoughtCount: (count: number) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  // Default values
  interfaceType: 1,
  maxThoughtCount: 1,
  decay: 0.1,
  likeAmount: 0.2,
  microphoneEnabled: false,
  
  // Actions to update settings
  setInterfaceType: (interfaceType: number) => set({ interfaceType }),
  setMaxThoughtCount: (count: number) => set({ maxThoughtCount: count }),
  setMicrophoneEnabled: (enabled: boolean) => set({ microphoneEnabled: enabled }),
})); 