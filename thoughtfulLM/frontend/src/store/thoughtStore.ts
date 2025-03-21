// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { Node } from 'reactflow';
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
  position: {
    x: number;
    y: number;
  };
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
  sentenceWordThreshold: number; // New threshold

  // Thoughts and nodes
  thoughts: Thought[];
  thoughtNodes: ThoughtNode[];

  // Actions
  updateInput: (newInput: string) => void;
  generateThoughtAtPosition: (triggerType: EventType, position?: { x: number, y: number }, relatedText?: string) => Thought;
  removeThought: (thoughtId: string) => void;
  checkIdleTrigger: () => boolean;
  checkWordCountTrigger: () => boolean;
  checkSentenceEndTrigger: (input: string) => boolean;
  setLastGenerationTimestamp: () => void;
}

// Temporary function to create a Thought without connection to the backend
// Currently, this is just a placeholder to allow the app to run, filled with random values
// TODO: Update this to use the backend API later
const createThoughtTemp = (triggerType: EventType): Thought => {
  const now = new Date().toISOString();
  const id = `thought_${Date.now()}`;

  // use utils to generate a random thought content
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

// Create a ThoughtNode from a Thought at a specific position or randomly
  const createThoughtNode = (thought: Thought, position?: { x: number, y: number }): ThoughtNode => {
  // Use provided position or generate random position
  // TODO: A more sophisticated algorithm will be used to position the thought node
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
  wordCountChangeThreshold: 7, // Threshold for word count change
  sentenceWordThreshold: 3, // Threshold for sentence word count that could trigger a thought by punctuation
  
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
  
  // Unified thought generation function
  generateThoughtAtPosition: (triggerType: EventType, position?: { x: number, y: number }) => {
    const state = get();
    const thought = createThoughtTemp(triggerType);
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
  
  removeThought: (thoughtId: string) => {
    set((state) => ({
      thoughts: state.thoughts.filter(t => t.id !== thoughtId),
      thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
    }));
  },
  
  checkIdleTrigger: () => {
    const state = get();
    const now = Date.now();
    return (now - state.lastGenerationTimestamp) > state.idleTimeThreshold;
  },
  
  checkWordCountTrigger: () => {
    const state = get();
    const currentWordCount = state.currentInput.split(/\s+/).filter(Boolean).length;
    const lastWordCount = state.wordCountAtLastGeneration;
    
    return Math.abs(currentWordCount - lastWordCount) >= state.wordCountChangeThreshold;
  },
  
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
  
  setLastGenerationTimestamp: () => {
    set({
      lastGenerationTimestamp: Date.now()
    });
  },
})); 