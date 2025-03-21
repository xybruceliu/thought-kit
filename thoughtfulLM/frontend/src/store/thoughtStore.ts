// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { Node, Position, XYPosition } from 'reactflow';
import { generateRandomThought, getRandomInt } from '../utils';
import { 
  Thought, 
  ThoughtConfig, 
} from '../types/thought';
import { Event, EventType } from '../types/event';
import { Timestamps } from '../types/common';

// ReactFlow node for thought bubble visualization
export interface ThoughtNode extends Node {
  id: string;
  type: 'thoughtBubble';
  position: XYPosition;
  data: {
    content: string;
    thought: Thought;
    blobVariant: number;
  };
}

// Define the store state
interface ThoughtStoreState {
  // Input tracking
  currentInput: string;
  wordCountAtLastGeneration: number;

  // Trigger tracking
  lastActivityTimestamp: number;
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count
  idleTriggerFired: boolean; // Flag to track if idle trigger has fired

  // Thoughts and nodes
  thoughts: Thought[];
  thoughtNodes: ThoughtNode[];
  maxThoughtCount: number; // Maximum number of thoughts to display
  removingThoughtIds: string[]; // Track thoughts being removed for animation

  // Actions
  updateInput: (newInput: string) => void;
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => Thought;
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => void;
  removeThought: (thoughtId: string) => void;
  setMaxThoughtCount: (count: number) => void;
}

// Create a Thought object
// Temporary function to create a thought randomly for testing purposes
// TODO: Replace with actual API call to create a thought
const createThought = (triggerType: EventType): Thought => {
  const now = new Date().toISOString();
  const id = `thought_${Date.now()}`;
  const content = generateRandomThought();
  
  return {
    id,
    content: {
      text: content,
    },
    config: {
      modality: 'TEXT',
      depth: getRandomInt(1, 5), 
      length: getRandomInt(2, 5),
      interactivity: 'VIEW',
      persistent: false,
      weight: 0.0,
    },
    timestamps: {
      created: now,
      updated: now,
    },
    triggerEvent: {
      id: `event_${Date.now()}`,
      type: triggerType,
      content: {
        text: "trigger event",
      },
      timestamps: {
        created: now,
        updated: now,
      },
    },
    references: [],
    user_comments: [],
    score: {
      weight: 0.0,
      saliency: Math.random() * 0.3 + 0.7, // Random value between 0.7 and 1.0
    }
  };
};

// Create a ThoughtNode from a Thought
const createThoughtNode = (thought: Thought, position?: XYPosition): ThoughtNode => {
  // Use provided position or generate random position
  const x = position?.x ?? getRandomInt(100, 700);
  const y = position?.y ?? getRandomInt(100, 500);
  
  return {
    id: thought.id,
    type: 'thoughtBubble',
    position: { x, y },
    data: {
      content: thought.content.text,
      thought,
      blobVariant: getRandomInt(0, 5),
    },
  };
};

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Input tracking
  currentInput: "",
  wordCountAtLastGeneration: 0,
  
  // Trigger tracking
  lastActivityTimestamp: Date.now(),
  idleTimeThreshold: 10000, // 10 seconds
  wordCountChangeThreshold: 6, // Words added/removed to trigger
  sentenceWordThreshold: 2, // Words in a sentence to trigger
  idleTriggerFired: false, // Initially not fired
  
  // Thoughts and nodes
  thoughts: [],
  thoughtNodes: [],
  maxThoughtCount: 5, // Maximum number of thoughts to display
  removingThoughtIds: [], // Initially empty
  
  // Actions
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
        lastActivityTimestamp: Date.now(),
        idleTriggerFired: false,
        wordCountAtLastGeneration: updatedWordCountAtLastGeneration
      };
    });
  },
  
  // Generate a thought at a specific position
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => {
    // Create thought and node
    const thought = createThought(triggerType);
    
    // Reference to the store functions
    const { thoughts, thoughtNodes, maxThoughtCount, removeThought, removingThoughtIds } = get();
    
    // Check if we'll exceed the maximum thought count (accounting for nodes already being removed)
    const activeThoughtCount = thoughts.length - removingThoughtIds.length;
    
    if (activeThoughtCount >= maxThoughtCount) {
      // Sort thoughts by saliency (lowest first), excluding those already being removed
      const availableThoughts = thoughts.filter(t => !removingThoughtIds.includes(t.id));
      const sortedThoughts = [...availableThoughts].sort((a, b) => 
        (a.score?.saliency || 0) - (b.score?.saliency || 0)
      );
      
      // Get the least salient thought
      const leastSalientThought = sortedThoughts[0];
      
      // Remove the least salient thought using the existing function
      console.log(`❗️ Removing least salient thought: ${leastSalientThought.id}`);
      removeThought(leastSalientThought.id);
    }
    
    // Now create and add the new thought node
    const thoughtNode = createThoughtNode(thought, position);
    
    // Update state with just the new thought (since we already removed the least salient one if needed)
    set((state) => ({
      thoughts: [...state.thoughts, thought],
      thoughtNodes: [...state.thoughtNodes, thoughtNode],
      wordCountAtLastGeneration: state.currentInput.split(/\s+/).filter(Boolean).length,
      lastActivityTimestamp: Date.now(),
      // If this is an idle trigger, mark it as fired
      idleTriggerFired: triggerType === 'IDLE_TIME' ? true : state.idleTriggerFired,
    }));
    
    return thought;
  },
  
  // Update a thought node's position
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => {
    set((state) => ({
      thoughtNodes: state.thoughtNodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  },
  
  // Remove a thought and its node
  removeThought: (thoughtId: string) => {
    // First mark the thought as removing (for animation)
    set((state) => ({
      removingThoughtIds: [...state.removingThoughtIds, thoughtId],
      thoughtNodes: state.thoughtNodes.map(node => 
        node.id === thoughtId ? { ...node, data: { ...node.data, isRemoving: true } } : node
      )
    }));
    
    // After animation delay, actually remove the thought
    setTimeout(() => {
      set((state) => ({
        thoughts: state.thoughts.filter(t => t.id !== thoughtId),
        thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
        removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
      }));
    }, 500); // Match the duration of the exit animation
  },
  
  // Set maxThoughtCount
  setMaxThoughtCount: (count: number) => {
    set((state) => ({
      maxThoughtCount: count,
    }));
  }
})); 