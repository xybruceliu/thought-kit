// Zustand store for managing memory
// This file handles memory state management for the application

import { create } from 'zustand';
import { Memory, MemoryItem } from '../types/memory';
import { thoughtApi } from '../api/thoughtApi';

// Define the store state
interface MemoryState {
  // Memory collections
  memory: Memory;
  
  // Actions
  createMemoryItem: (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => Promise<MemoryItem | null>;
  clearMemories: (type?: 'LONG_TERM' | 'SHORT_TERM') => void;
}

// Create the store
export const useMemoryStore = create<MemoryState>((set, get) => ({
  // Memory state
  memory: {
    long_term: [],
    short_term: [],
  },
  
  // Create a memory item
  createMemoryItem: async (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => {
    try {
      // Call the backend API to create a memory item (doesn't store it)
      const memoryItem = await thoughtApi.createMemory({
        type,
        text
      });
      
      // Store the memory item in the frontend
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
    } catch (error) {
      console.error('Error creating memory item:', error);
      return null;
    }
  },
  
  // Clear memory (all or by type)
  clearMemories: (type?: 'LONG_TERM' | 'SHORT_TERM') => {
    // Update local state only - no backend call needed
    set((state) => {
      if (!type) {
        // Clear all memories
        return {
          memory: {
            long_term: [],
            short_term: []
          }
        };
      } else if (type === 'LONG_TERM') {
        // Clear only long term memories
        return {
          memory: {
            ...state.memory,
            long_term: []
          }
        };
      } else {
        // Clear only short term memories
        return {
          memory: {
            ...state.memory,
            short_term: []
          }
        };
      }
    });
  }
})); 