// Zustand store for managing text input and trigger detection
// This file handles input tracking and trigger detection state

import { create } from 'zustand';
import { detectNewContent } from '../utils/textDiff';

// Define the store state
interface InputStoreState {
  // Input tracking
  currentInput: string;
  inputAtLastGeneration: string; // Track input text at last thought generation
  newInput: string; // Track what's new since last generation

  // Trigger tracking
  lastActivityTimestamp: number;
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired

  // Actions
  updateInput: (inputText: string) => void;
  updateActivityTimestamp: () => void; // Renamed from resetIdleState
  setIdleTriggerFired: (fired: boolean) => void;
  updateInputBaseline: (input: string) => void; // New function to update input at generation
}

// Create the store
export const useInputStore = create<InputStoreState>((set) => ({
  // Input tracking
  currentInput: "",
  inputAtLastGeneration: "", // Initially empty
  newInput: "", // Initially empty
    
  // Trigger tracking
  lastActivityTimestamp: Date.now(),
  idleTimeThreshold: 17000, // 17 seconds
  wordCountChangeThreshold: 7, // Words added/removed to trigger
  sentenceWordThreshold: 3, // Words in a sentence to trigger
  idleTriggerFired: false, // Initially not fired
  
  // Update input text and reset activity timestamp
  updateInput: (inputText: string) => {
    set((state) => {
      // Use the utility function to detect what's new
      const deltaInput = detectNewContent(state.inputAtLastGeneration, inputText);
      
      return {
        currentInput: inputText,
        // Store what's new based on our detection
        newInput: deltaInput,
        // Reset idle trigger flag when user types
        idleTriggerFired: false,
        // Update last activity timestamp if there's
        lastActivityTimestamp: Date.now(),
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
  
  // Update the input text baseline after a thought has been generated
  updateInputBaseline: (input: string) => {
    set((state) => {
      
      return { 
        inputAtLastGeneration: input,
        newInput: "" // Reset the new input when we update the baseline
      };
    });
  },
})); 