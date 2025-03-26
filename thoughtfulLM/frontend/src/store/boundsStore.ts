// Zustand store for managing node positioning bounds
// Provides global state for positioning bounds across the application

import { create } from 'zustand';
import { XYPosition } from 'reactflow';
import { Bounds } from '../utils/nodePositioning';

// Define the store state
interface BoundsStoreState {
  // Current bounds being used for node positioning
  currentBounds: Bounds | null;
  
  // Default bounds to use when no specific bounds are set
  defaultBounds: Bounds;
  
  // Actions
  setBounds: (bounds: Bounds) => void;
  resetToDefault: () => void;
  getBounds: () => Bounds;
}

// Create default bounds
const createDefaultBounds = (): Bounds => ({
  topLeft: { x: 100, y: 100 },
  topRight: { x: 500, y: 100 },
  bottomLeft: { x: 100, y: 300 },
  bottomRight: { x: 500, y: 300 }
});

// Create the store
export const useBoundsStore = create<BoundsStoreState>((set, get) => ({
  // Initialize with null current bounds (will use default when needed)
  currentBounds: null,
  
  // Default bounds
  defaultBounds: createDefaultBounds(),
  
  // Set new bounds
  setBounds: (bounds: Bounds) => {
    console.log('🖼 Setting bounds for positioning thoughts', bounds);
    set({ currentBounds: bounds });
  },
  
  // Reset to default bounds
  resetToDefault: () => {
    set({ currentBounds: get().defaultBounds });
  },
  
  // Get current bounds or default if none set
  getBounds: () => {
    return get().currentBounds || get().defaultBounds;
  }
})); 