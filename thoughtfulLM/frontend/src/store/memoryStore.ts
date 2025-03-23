// Zustand store for managing memory
// This file handles memory state management for the application

import { create } from 'zustand';
import { Memory, MemoryItem } from '../types/memory';
import { thoughtApi } from '../api/thoughtApi';

// Define the store state
interface MemoryState {
  // Memory collections
  memory: Memory;
  isLoading: boolean;
  
  // Actions
  addMemoryItem: (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => Promise<MemoryItem | null>;
  clearMemory: (type?: 'LONG_TERM' | 'SHORT_TERM') => Promise<void>;
  getMemoryByType: (type: 'LONG_TERM' | 'SHORT_TERM') => Promise<MemoryItem[]>;
  fetchMemories: (type?: 'LONG_TERM' | 'SHORT_TERM') => Promise<void>;
}

// Create the store
export const useMemoryStore = create<MemoryState>((set, get) => ({
  // Memory state
  memory: {
    long_term: [],
    short_term: [],
  },
  isLoading: false,
  
  // Add a memory item
  addMemoryItem: async (text: string, type: 'LONG_TERM' | 'SHORT_TERM') => {
    try {
      set({ isLoading: true });
      
      // Call the backend API to add a memory item
      const memoryItem = await thoughtApi.addMemory({
        type,
        text
      });
      
      // Update local state
      set((state) => {
        if (type === 'LONG_TERM') {
          return {
            memory: {
              ...state.memory,
              long_term: [...state.memory.long_term, memoryItem]
            },
            isLoading: false
          };
        } else {
          return {
            memory: {
              ...state.memory,
              short_term: [...state.memory.short_term, memoryItem]
            },
            isLoading: false
          };
        }
      });
      
      return memoryItem;
    } catch (error) {
      console.error('Error adding memory item:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  // Clear memory (all or by type)
  clearMemory: async (type?: 'LONG_TERM' | 'SHORT_TERM') => {
    try {
      set({ isLoading: true });
      
      // Call the backend API to clear all memories
      // The backend doesn't support clearing by type, only all memories
      await thoughtApi.clearMemories();
      
      // Update local state
      set((state) => {
        if (!type) {
          return {
            memory: {
              long_term: [],
              short_term: []
            },
            isLoading: false
          };
        } else if (type === 'LONG_TERM') {
          return {
            memory: {
              ...state.memory,
              long_term: []
            },
            isLoading: false
          };
        } else {
          return {
            memory: {
              ...state.memory,
              short_term: []
            },
            isLoading: false
          };
        }
      });
    } catch (error) {
      console.error('Error clearing memories:', error);
      set({ isLoading: false });
    }
  },
  
  // Get memory by type using the API
  getMemoryByType: async (type: 'LONG_TERM' | 'SHORT_TERM') => {
    try {
      const result = await thoughtApi.getMemoriesByType(type);
      
      // If the result is an array, it's already the list of memory items of the requested type
      if (Array.isArray(result)) {
        return result;
      }
      
      // If it's the Memory object, extract the appropriate array based on type
      return type === 'LONG_TERM' ? result.long_term : result.short_term;
    } catch (error) {
      console.error(`Error getting memory by type ${type}:`, error);
      return [];
    }
  },
  
  // Fetch memories from the backend and update the local state
  fetchMemories: async (type?: 'LONG_TERM' | 'SHORT_TERM') => {
    try {
      set({ isLoading: true });
      
      const result = await thoughtApi.getMemoriesByType(type);
      
      // Update local state based on the response format and type
      if (type) {
        // If a specific type was requested
        const memories = Array.isArray(result) ? result : 
                         (type === 'LONG_TERM' ? result.long_term : result.short_term);
        
        set((state) => ({
          memory: {
            ...state.memory,
            [type === 'LONG_TERM' ? 'long_term' : 'short_term']: memories
          },
          isLoading: false
        }));
      } else {
        // If all memories were requested (no specific type)
        // The result should be a Memory object with both long_term and short_term
        if (!Array.isArray(result)) {
          set({
            memory: result as Memory,
            isLoading: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching memories:', error);
      set({ isLoading: false });
    }
  }
})); 