// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { Node } from 'reactflow';
import { getRandomInt } from '../utils';
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

  // Thoughts and nodes
  thoughts: Thought[];
  thoughtNodes: ThoughtNode[];

  // Actions
  updateInput: (newInput: string) => void;
  generateThought: (triggerType: EventType, relatedText?: string) => void;
  removeThought: (thoughtId: string) => void;
  checkIdleTrigger: () => boolean;
  checkWordCountTrigger: () => boolean;
  checkSentenceEndTrigger: (input: string) => boolean;
  setLastGenerationTimestamp: () => void;
}

const createThought = (triggerType: EventType, relatedText: string = ""): Thought => {
  const now = new Date().toISOString();
  const id = `thought_${Date.now()}`;
  
  return {
    id,
    content: {
      text: relatedText || "A new thought",
    },
    config: {
      modality: 'TEXT',
      depth: getRandomInt(1, 5), 
      length: getRandomInt(3, 10),
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
        text: relatedText,
      },
      timestamps: {
        created: now,
        updated: now,
      },
    },
  };
};

// Create a ThoughtNode from a Thought
const createThoughtNode = (thought: Thought): ThoughtNode => {
  // Position the thought bubble randomly around the center of the screen
  // In a real app, this would be more sophisticated
  const x = getRandomInt(100, 700);
  const y = getRandomInt(100, 500);
  
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
  wordCountChangeThreshold: 7,
  
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
  
  generateThought: (triggerType: EventType, relatedText?: string) => {
    const state = get();
    const thought = createThought(triggerType, relatedText || state.currentInput);
    const thoughtNode = createThoughtNode(thought);
    
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
    // Check if the last character is a sentence-ending punctuation
    const lastChar = input.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Check if this punctuation follows at least 3 words
    // This avoids triggering on things like "Hello!!!" or repeated punctuation
    const textSinceLastGeneration = input.slice(get().previousInput.length);
    const wordsSinceLastGeneration = textSinceLastGeneration
      .split(/\s+/)
      .filter(Boolean);
    
    return wordsSinceLastGeneration.length >= 3;
  },
  
  setLastGenerationTimestamp: () => {
    set({
      lastGenerationTimestamp: Date.now()
    });
  },
})); 