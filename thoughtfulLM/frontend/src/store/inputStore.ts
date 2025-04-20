// Zustand store for managing text input and trigger detection
// This file handles input tracking and trigger detection state

import { create } from 'zustand';
import { detectNewContent } from '../utils/textDiff';

// Input data structure 
interface InputData {
  currentInput: string;
  inputAtLastGeneration: string; // Track input text at last thought generation
  newInput: string; // Track what's new since last generation
  lastActivityTimestamp: number;
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired
}

// Define the store state
interface InputStoreState {
  // Single input data - simplified from multiple inputs
  inputData: InputData;
  
  // Global settings
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count

  // Actions
  updateInput: (inputText: string) => void;
  updateActivityTimestamp: () => void;
  setIdleTriggerFired: (fired: boolean) => void;
  updateInputBaseline: (input: string) => void;
  getInputData: () => InputData;
  clearInput: () => void;
}

// Default input data
const createDefaultInputData = (): InputData => ({
  currentInput: "",
  inputAtLastGeneration: "",
  newInput: "",
  lastActivityTimestamp: Date.now(),
  idleTriggerFired: false,
});

// Create the store
export const useInputStore = create<InputStoreState>((set, get) => ({
  // Initialize with default input data
  inputData: createDefaultInputData(),
    
  // Global trigger settings
  idleTimeThreshold: 3000, // 3 seconds
  wordCountChangeThreshold: 7, // Words added/removed to trigger
  sentenceWordThreshold: 2, // Words in a sentence to trigger
  
  // Helper to get input data
  getInputData: () => {
    return get().inputData;
  },
  
  // Update input text and reset activity timestamp
  updateInput: (inputText: string) => {
    set((state) => {
      // Use the utility function to detect what's new
      const deltaInput = detectNewContent(state.inputData.inputAtLastGeneration, inputText);
      
      return {
        inputData: {
          ...state.inputData,
          currentInput: inputText,
          newInput: deltaInput,
          idleTriggerFired: false,
          lastActivityTimestamp: Date.now(),
        }
      };
    });
  },
  
  // Updates the activity timestamp without changing idle trigger state
  updateActivityTimestamp: () => {
    set((state) => ({
      inputData: {
        ...state.inputData,
        lastActivityTimestamp: Date.now(),
      }
    }));
  },
  
  // Set idle trigger fired state
  setIdleTriggerFired: (fired: boolean) => {
    set((state) => ({
      inputData: {
        ...state.inputData,
        idleTriggerFired: fired,
      }
    }));
  },
  
  // Update the input text baseline after a thought has been generated
  updateInputBaseline: (input: string) => {
    set((state) => ({
      inputData: {
        ...state.inputData,
        inputAtLastGeneration: input,
        newInput: "" // Reset the new input when we update the baseline
      }
    }));
  },
  
  // Clear input and reset to default
  clearInput: () => {
    set({
      inputData: createDefaultInputData()
    });
  },
})); 