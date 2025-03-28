// Zustand store for managing text input and trigger detection
// This file handles input tracking and trigger detection state

import { create } from 'zustand';
import { detectNewContent } from '../utils/textDiff';

// Input data structure for each input
interface InputData {
  currentInput: string;
  inputAtLastGeneration: string; // Track input text at last thought generation
  newInput: string; // Track what's new since last generation
  lastActivityTimestamp: number;
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired
}

// Define the store state
interface InputStoreState {
  // Map of input IDs to their respective data
  inputs: Record<string, InputData>;
  
  // Currently active input ID
  activeInputId: string | null;
  
  // Global settings (shared across all inputs)
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count

  // Actions
  updateInput: (inputId: string, inputText: string) => void;
  updateActivityTimestamp: (inputId: string) => void;
  setIdleTriggerFired: (inputId: string, fired: boolean) => void;
  updateInputBaseline: (inputId: string, input: string) => void;
  setActiveInputId: (inputId: string) => void;
  getInputData: (inputId: string) => InputData;
  addInput: (inputId: string) => void;
  removeInput: (inputId: string) => void;
}

// Default input data for new inputs
const createDefaultInputData = (): InputData => ({
  currentInput: "",
  inputAtLastGeneration: "",
  newInput: "",
  lastActivityTimestamp: Date.now(),
  idleTriggerFired: false,
});

// Create the store
export const useInputStore = create<InputStoreState>((set, get) => ({
  // Initialize with an empty inputs map
  inputs: {},
  
  // No active input initially
  activeInputId: null,
    
  // Global trigger settings
  idleTimeThreshold: 17000, // 17 seconds
  wordCountChangeThreshold: 7, // Words added/removed to trigger
  sentenceWordThreshold: 2, // Words in a sentence to trigger
  
  // Add a new input to the store
  addInput: (inputId: string) => {
    set((state) => {
      // Only add if it doesn't already exist
      if (state.inputs[inputId]) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [inputId]: createDefaultInputData(),
        },
        // Set the input as active
        activeInputId: inputId,
      };
    });
  },
  
  // Remove an input from the store
  removeInput: (inputId: string) => {
    set((state) => {
      const newInputs = { ...state.inputs };
      delete newInputs[inputId];
      
      // If the active input is being removed, set to null or another input
      let newActiveId = state.activeInputId;
      if (state.activeInputId === inputId) {
        const remainingIds = Object.keys(newInputs);
        newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
      }
      
      return {
        inputs: newInputs,
        activeInputId: newActiveId,
      };
    });
  },
  
  // Set the active input
  setActiveInputId: (inputId: string) => {
    // Ensure the input exists before setting it as active
    const state = get();
    if (!state.inputs[inputId]) {
      // Create it if it doesn't exist
      get().addInput(inputId);
    }
    set({ activeInputId: inputId });
  },
  
  // Helper to get input data, creating it if it doesn't exist
  getInputData: (inputId: string) => {
    const state = get();
    // Create input data if it doesn't exist
    if (!state.inputs[inputId]) {
      get().addInput(inputId);
      return get().inputs[inputId];
    }
    return state.inputs[inputId];
  },
  
  // Update input text and reset activity timestamp for a specific input
  updateInput: (inputId: string, inputText: string) => {
    set((state) => {
      // Get existing input data or create defaults
      const inputData = state.inputs[inputId] || createDefaultInputData();
      
      // Use the utility function to detect what's new
      const deltaInput = detectNewContent(inputData.inputAtLastGeneration, inputText);
      
      return {
        inputs: {
          ...state.inputs,
          [inputId]: {
            ...inputData,
            currentInput: inputText,
            newInput: deltaInput,
            idleTriggerFired: false,
            lastActivityTimestamp: Date.now(),
          }
        }
      };
    });
  },
  
  // Updates the activity timestamp without changing idle trigger state
  updateActivityTimestamp: (inputId: string) => {
    set((state) => {
      const inputData = state.inputs[inputId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [inputId]: {
            ...inputData,
            lastActivityTimestamp: Date.now(),
          }
        }
      };
    });
  },
  
  // Set idle trigger fired state for a specific input
  setIdleTriggerFired: (inputId: string, fired: boolean) => {
    set((state) => {
      const inputData = state.inputs[inputId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [inputId]: {
            ...inputData,
            idleTriggerFired: fired,
          }
        }
      };
    });
  },
  
  // Update the input text baseline after a thought has been generated
  updateInputBaseline: (inputId: string, input: string) => {
    set((state) => {
      const inputData = state.inputs[inputId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [inputId]: {
            ...inputData,
            inputAtLastGeneration: input,
            newInput: "" // Reset the new input when we update the baseline
          }
        }
      };
    });
  },
})); 