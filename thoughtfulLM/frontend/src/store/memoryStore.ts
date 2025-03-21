// Zustand store for managing memory
// This file handles memory state management for the application

import { create } from 'zustand';
import { Memory, MemoryItem } from '../types/memory';

// Define the store state
interface MemoryState {
  // Memory collections
  memory: Memory;
  
  // Actions
  addMemoryItem: (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => MemoryItem;
  removeMemoryItem: (id: string) => void;
  clearMemory: (type?: 'LONG_TERM' | 'SHORT_TERM') => void;
  getMemoryByType: (type: 'LONG_TERM' | 'SHORT_TERM') => MemoryItem[];
}

// Create a new memory item
const createMemoryItem = (text: string, type: 'LONG_TERM' | 'SHORT_TERM'): MemoryItem => {
  const now = new Date().toISOString();
  
  return {
    id: `memory_${Date.now()}`,
    timestamps: {
      created: now,
      updated: now,
    },
    type,
    content: {
      text,
    }
  };
};

// Create the store
export const useMemoryStore = create<MemoryState>((set, get) => ({
  // Memory state
  memory: {
    long_term: [],
    short_term: [],
  },
  
  // Add a memory item
  addMemoryItem: (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => {
    const memoryItem = createMemoryItem(text, type);
    
    set((state) => {
      if (type === 'LONG_TERM') {
        return {
          memory: {
            ...state.memory,
            long_term: [...state.memory.long_term, memoryItem]
          }
        };
      } else {
        return {
          memory: {
            ...state.memory,
            short_term: [...state.memory.short_term, memoryItem]
          }
        };
      }
    });
    
    return memoryItem;
  },
  
  // Remove a memory item by ID
  removeMemoryItem: (id: string) => {
    set((state) => ({
      memory: {
        long_term: state.memory.long_term.filter(item => item.id !== id),
        short_term: state.memory.short_term.filter(item => item.id !== id),
      }
    }));
  },
  
  // Clear memory (all or by type)
  clearMemory: (type?: 'LONG_TERM' | 'SHORT_TERM') => {
    set((state) => {
      if (!type) {
        return {
          memory: {
            long_term: [],
            short_term: []
          }
        };
      } else if (type === 'LONG_TERM') {
        return {
          memory: {
            ...state.memory,
            long_term: []
          }
        };
      } else {
        return {
          memory: {
            ...state.memory,
            short_term: []
          }
        };
      }
    });
  },
  
  // Get memory items by type
  getMemoryByType: (type: 'LONG_TERM' | 'SHORT_TERM') => {
    const state = get();
    return type === 'LONG_TERM' ? state.memory.long_term : state.memory.short_term;
  },
})); 