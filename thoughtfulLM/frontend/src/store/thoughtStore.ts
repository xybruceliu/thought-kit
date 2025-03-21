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
interface ThoughtState {
  // Input tracking
  currentInput: string;
  previousInput: string;
  wordCountAtLastGeneration: number;

  // Trigger tracking
  lastGenerationTimestamp: number;
  idleTimeThreshold: number; // in milliseconds
  wordCountChangeThreshold: number;
  sentenceWordThreshold: number; // Threshold for sentence word count

  // Thoughts and nodes
  thoughts: Thought[];
  thoughtNodes: ThoughtNode[];

  // Actions
  updateInput: (newInput: string) => void;
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => Thought;
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => void;
  removeThought: (thoughtId: string) => void;
  
  // Trigger checks
  checkIdleTrigger: () => boolean;
  checkWordCountTrigger: () => boolean;
  checkSentenceEndTrigger: (input: string) => boolean;
}

// Create a Thought object
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
      weight: Math.random(),
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
      weight: Math.random(),
      saliency: Math.random() * 0.7 + 0.3, // Random value between 0.3 and 1.0
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
export const useThoughtStore = create<ThoughtState>((set, get) => ({
  // Input tracking
  currentInput: "",
  previousInput: "",
  wordCountAtLastGeneration: 0,
  
  // Trigger tracking
  lastGenerationTimestamp: Date.now(),
  idleTimeThreshold: 10000, // 10 seconds
  wordCountChangeThreshold: 7, // Words added/removed to trigger
  sentenceWordThreshold: 3, // Words in a sentence to trigger
  
  // Thoughts and nodes
  thoughts: [],
  thoughtNodes: [],
  
  // Actions
  updateInput: (newInput: string) => {
    set((state) => ({
      previousInput: state.currentInput,
      currentInput: newInput,
    }));
  },
  
  // Generate a thought at a specific position
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => {
    // Create thought and node
    const thought = createThought(triggerType);
    const thoughtNode = createThoughtNode(thought, position);
    
    // Update state
    set((state) => ({
      thoughts: [...state.thoughts, thought],
      thoughtNodes: [...state.thoughtNodes, thoughtNode],
      wordCountAtLastGeneration: state.currentInput.split(/\s+/).filter(Boolean).length,
      lastGenerationTimestamp: Date.now(),
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
    set((state) => ({
      thoughts: state.thoughts.filter(t => t.id !== thoughtId),
      thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
    }));
  },
  
  // Check if idle time trigger condition is met
  checkIdleTrigger: () => {
    const state = get();
    const now = Date.now();
    return (now - state.lastGenerationTimestamp) > state.idleTimeThreshold;
  },
  
  // Check if word count change trigger condition is met
  checkWordCountTrigger: () => {
    const state = get();
    const currentWordCount = state.currentInput.split(/\s+/).filter(Boolean).length;
    const lastWordCount = state.wordCountAtLastGeneration;
    
    return Math.abs(currentWordCount - lastWordCount) >= state.wordCountChangeThreshold;
  },
  
  // Check if sentence end trigger condition is met
  checkSentenceEndTrigger: (input: string) => {
    const state = get();
    // Check if the last character is a sentence-ending punctuation
    const lastChar = input.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Check if this punctuation follows at least N words
    const textSinceLastGeneration = input.slice(state.previousInput.length);
    const wordsSinceLastGeneration = textSinceLastGeneration
      .split(/\s+/)
      .filter(Boolean);
    
    return wordsSinceLastGeneration.length >= state.sentenceWordThreshold;
  },
})); 