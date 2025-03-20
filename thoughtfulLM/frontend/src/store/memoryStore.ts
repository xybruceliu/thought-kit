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
  getRelevantMemory: (searchText: string, limit?: number) => MemoryItem[];
}

// Create a new memory item
const createMemoryItem = (text: string, type: 'LONG_TERM' | 'SHORT_TERM'): MemoryItem => {
  const now = new Date().toISOString();
  
  return {
    id: `memory_${Date.now()}`,
    timestamp: {
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
  
  // Get relevant memory items based on text similarity
  // This is a simplified implementation - in a real app, you'd use embedding similarity
  getRelevantMemory: (searchText: string, limit = 5) => {
    const state = get();
    const allMemory = [...state.memory.long_term, ...state.memory.short_term];
    
    // Simple relevance matching - in a real app, you'd use vector similarity
    const searchLower = searchText.toLowerCase();
    
    // Sort by simple text matching (more sophisticated methods would be used in production)
    const sortedMemory = allMemory.sort((a, b) => {
      const aRelevance = a.content.text.toLowerCase().includes(searchLower) ? 1 : 0;
      const bRelevance = b.content.text.toLowerCase().includes(searchLower) ? 1 : 0;
      return bRelevance - aRelevance;
    });
    
    return sortedMemory.slice(0, limit);
  },
})); 