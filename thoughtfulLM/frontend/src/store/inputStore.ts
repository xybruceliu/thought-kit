// Zustand store for managing text input and trigger detection
// This file handles input tracking and trigger detection state

import { create } from 'zustand';

// Define the store state
interface InputStoreState {
  // Input tracking
  currentInput: string;
  wordCountAtLastGeneration: number;

  // Trigger tracking
  lastActivityTimestamp: number;
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired

  // Actions
  updateInput: (newInput: string) => void;
  updateActivityTimestamp: () => void; // Renamed from resetIdleState
  setIdleTriggerFired: (fired: boolean) => void;
  updateWordCountBaseline: (count: number) => void; // Renamed from setWordCountAtLastGeneration
}

// Create the store
export const useInputStore = create<InputStoreState>((set) => ({
  // Input tracking
  currentInput: "",
  wordCountAtLastGeneration: 0,
  
  // Trigger tracking
  lastActivityTimestamp: Date.now(),
  idleTimeThreshold: 10000, // 10 seconds
  wordCountChangeThreshold: 7, // Words added/removed to trigger
  sentenceWordThreshold: 3, // Words in a sentence to trigger
  idleTriggerFired: false, // Initially not fired
  
  // Update input text and reset activity timestamp
  updateInput: (newInput: string) => {
    set((state) => {
      const currentWordCount = newInput.split(/\s+/).filter(Boolean).length;
      const previousWordCount = state.currentInput.split(/\s+/).filter(Boolean).length;
      
      // Reset wordCountAtLastGeneration if word count decreases significantly
      // This prevents requiring too many words to trigger the next thought
      let updatedWordCountAtLastGeneration = state.wordCountAtLastGeneration;
      if (currentWordCount < previousWordCount) {
        updatedWordCountAtLastGeneration = currentWordCount;
      }
      
      return {
        currentInput: newInput,
        // Reset idle trigger flag when user types
        idleTriggerFired: false,
        // Update last activity timestamp
        lastActivityTimestamp: Date.now(),
        // Update word count at last generation if needed
        wordCountAtLastGeneration: updatedWordCountAtLastGeneration,
      };
    });
  },
  
  // Updates the activity timestamp without changing idle trigger state
  // Called after thought generation to mark activity
  updateActivityTimestamp: () => {
    set((state) => ({
      lastActivityTimestamp: Date.now(),
    }));
  },
  
  // Set idle trigger fired state
  setIdleTriggerFired: (fired: boolean) => {
    set({ idleTriggerFired: fired });
  },
  
  // Update the baseline word count for future trigger detection
  // Called after thought generation to mark the new starting point
  updateWordCountBaseline: (count: number) => {
    set({ wordCountAtLastGeneration: count });
  },
})); 