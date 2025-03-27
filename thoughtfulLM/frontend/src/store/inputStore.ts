// Zustand store for managing text input and trigger detection
// This file handles input tracking and trigger detection state

import { create } from 'zustand';
import { detectNewContent } from '../utils/textDiff';

// Input data structure for each input node
interface InputData {
  currentInput: string;
  inputAtLastGeneration: string; // Track input text at last thought generation
  newInput: string; // Track what's new since last generation
  lastActivityTimestamp: number;
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired
}

// Define the store state
interface InputStoreState {
  // Map of input node IDs to their respective data
  inputs: Record<string, InputData>;
  
  // Currently active input node ID
  activeInputId: string | null;
  
  // Global settings (shared across all inputs)
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count

  // Actions
  updateInput: (nodeId: string, inputText: string) => void;
  updateActivityTimestamp: (nodeId: string) => void;
  setIdleTriggerFired: (nodeId: string, fired: boolean) => void;
  updateInputBaseline: (nodeId: string, input: string) => void;
  setActiveInputId: (nodeId: string) => void;
  getInputData: (nodeId: string) => InputData;
  registerInputNode: (nodeId: string) => void;
  removeInputNode: (nodeId: string) => void;
}

// Default input data for new input nodes
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
  
  // Add a new input node to the store
  registerInputNode: (nodeId: string) => {
    set((state) => {
      // Only add if it doesn't already exist
      if (state.inputs[nodeId]) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [nodeId]: createDefaultInputData(),
        },
        // If this is the first input, set it as active
        activeInputId: state.activeInputId || nodeId,
      };
    });
  },
  
  // Remove an input node from the store
  removeInputNode: (nodeId: string) => {
    set((state) => {
      const newInputs = { ...state.inputs };
      delete newInputs[nodeId];
      
      // If the active input is being removed, set to null or another input
      let newActiveId = state.activeInputId;
      if (state.activeInputId === nodeId) {
        const remainingIds = Object.keys(newInputs);
        newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
      }
      
      return {
        inputs: newInputs,
        activeInputId: newActiveId,
      };
    });
  },
  
  // Set the active input node
  setActiveInputId: (nodeId: string) => {
    // Ensure the input exists before setting it as active
    const state = get();
    if (!state.inputs[nodeId]) {
      // Create it if it doesn't exist
      get().registerInputNode(nodeId);
    }
    set({ activeInputId: nodeId });
  },
  
  // Helper to get input data, creating it if it doesn't exist
  getInputData: (nodeId: string) => {
    const state = get();
    // Create input data if it doesn't exist
    if (!state.inputs[nodeId]) {
      get().registerInputNode(nodeId);
      return get().inputs[nodeId];
    }
    return state.inputs[nodeId];
  },
  
  // Update input text and reset activity timestamp for a specific node
  updateInput: (nodeId: string, inputText: string) => {
    set((state) => {
      // Get existing input data or create defaults
      const inputData = state.inputs[nodeId] || createDefaultInputData();
      
      // Use the utility function to detect what's new
      const deltaInput = detectNewContent(inputData.inputAtLastGeneration, inputText);
      
      return {
        inputs: {
          ...state.inputs,
          [nodeId]: {
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
  updateActivityTimestamp: (nodeId: string) => {
    set((state) => {
      const inputData = state.inputs[nodeId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [nodeId]: {
            ...inputData,
            lastActivityTimestamp: Date.now(),
          }
        }
      };
    });
  },
  
  // Set idle trigger fired state for a specific node
  setIdleTriggerFired: (nodeId: string, fired: boolean) => {
    set((state) => {
      const inputData = state.inputs[nodeId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [nodeId]: {
            ...inputData,
            idleTriggerFired: fired,
          }
        }
      };
    });
  },
  
  // Update the input text baseline after a thought has been generated
  updateInputBaseline: (nodeId: string, input: string) => {
    set((state) => {
      const inputData = state.inputs[nodeId];
      if (!inputData) return state;
      
      return {
        inputs: {
          ...state.inputs,
          [nodeId]: {
            ...inputData,
            inputAtLastGeneration: input,
            newInput: "" // Reset the new input when we update the baseline
          }
        }
      };
    });
  },
})); 