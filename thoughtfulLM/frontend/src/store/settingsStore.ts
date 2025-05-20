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
  showThoughtPills: boolean;
  clearThoughtsOnSubmit: boolean;
  
  // Audio settings
  microphoneEnabled: boolean;
  
  // Debug settings
  debugMode: boolean;
  
  // Actions
  setInterfaceType: (interfaceType: number) => void;
  setMaxThoughtCount: (count: number) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
  setShowThoughtPills: (show: boolean) => void;
  setClearThoughtsOnSubmit: (clear: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  // Default values
  interfaceType: 1,
  maxThoughtCount: 5,
  decay: 0.1,
  likeAmount: 0.2,
  showThoughtPills: true,
  clearThoughtsOnSubmit: true,
  microphoneEnabled: false,
  debugMode: false,
  
  // Actions to update settings
  setInterfaceType: (interfaceType: number) => set({ interfaceType }),
  setMaxThoughtCount: (count: number) => set({ maxThoughtCount: count }),
  setMicrophoneEnabled: (enabled: boolean) => set({ microphoneEnabled: enabled }),
  setDebugMode: (enabled: boolean) => set({ debugMode: enabled }),
  setShowThoughtPills: (show: boolean) => set({ showThoughtPills: show }),
  setClearThoughtsOnSubmit: (clear: boolean) => set({ clearThoughtsOnSubmit: clear }),
})); 