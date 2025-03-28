// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { getRandomInt } from '../utils';
import { 
  Thought, 
} from '../types/thought';
import { EventType } from '../types/event';
import { thoughtApi } from '../api/thoughtApi';
import { useSettingsStore } from './settingsStore';

// Define the store state
interface ThoughtStoreState {
  // Data
  thoughts: Thought[];
  isLoading: boolean; // Track API loading state
  
  // Active thought IDs - thoughts that are currently active in the system
  activeThoughtIds: string[];
  
  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought

  // Active thought management
  addActiveThought: (thoughtId: string) => void;
  removeActiveThought: (thoughtId: string) => void;
  clearActiveThoughts: () => void;
  isThoughtActive: (thoughtId: string) => boolean;
  
  // Actions
  generateThought: (triggerType: EventType, position?: { x: number, y: number }) => Promise<Thought | null>;
  updateThought: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => Promise<void>;
  clearThoughts: () => void;
  
  // Thought operations
  operateOnThought: (thoughtId: string, operation: string, options?: object) => Promise<void>;
  handleThoughtLike: (thoughtId: string) => Promise<void>; 
  handleThoughtDislike: (thoughtId: string) => Promise<void>;
  handleThoughtPin: (thoughtId: string) => Promise<void>;
  handleThoughtDelete: (thoughtId: string) => Promise<void>;
  handleThoughtsSubmit: () => Promise<string | null>;
  
  // Track thoughts being removed for animation (just the ids, not the nodes)
  removingThoughtIds: string[];
  markThoughtAsRemoving: (thoughtId: string) => void;
  unmarkThoughtAsRemoving: (thoughtId: string) => void;
  
  // Signal for response creation
  onResponseCreated?: (content: string) => string;
  
  // Callback for ReactFlow integration
  onThoughtRemoving?: (thoughtId: string) => void;
  setThoughtRemovingCallback: (callback: (thoughtId: string) => void) => void;
}

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Data
  thoughts: [],
  removingThoughtIds: [], // Track thoughts being removed for animation
  isLoading: false, // Loading state
  activeThoughtIds: [], // Track active thought IDs
  
  // SETTINGS
  maxThoughtCount: useSettingsStore.getState().maxThoughtCount,
  decay: useSettingsStore.getState().decay,
  likeAmount: useSettingsStore.getState().likeAmount, 
  
  // Active thought management methods
  addActiveThought: (thoughtId: string) => {
    set((state) => {
      // Only add if it doesn't already exist in the active list
      if (state.activeThoughtIds.includes(thoughtId)) return state;
      
      return {
        activeThoughtIds: [...state.activeThoughtIds, thoughtId]
      };
    });
  },
  
  removeActiveThought: (thoughtId: string) => {
    set((state) => ({
      activeThoughtIds: state.activeThoughtIds.filter(id => id !== thoughtId)
    }));
  },
  
  clearActiveThoughts: () => {
    set({ activeThoughtIds: [] });
  },
  
  isThoughtActive: (thoughtId: string) => {
    return get().activeThoughtIds.includes(thoughtId);
  },
  
  // Track thoughts being removed
  markThoughtAsRemoving: (thoughtId: string) => {
    set((state) => ({
      removingThoughtIds: [...state.removingThoughtIds, thoughtId]
    }));
    
    // Call the ReactFlow integration callback if it exists
    const callback = get().onThoughtRemoving;
    if (callback) {
      callback(thoughtId);
    }
  },
  
  unmarkThoughtAsRemoving: (thoughtId: string) => {
    set((state) => ({
      removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
    }));
  },

  generateThought: async (triggerType: EventType, position?: { x: number, y: number }) => {
    try {
      set({ isLoading: true });

      // Get input data
      const inputStoreModule = await import('./inputStore');
      const { useInputStore } = inputStoreModule;
      const { activeInputId, getInputData } = useInputStore.getState();
      
      if (!activeInputId) {
        console.error('No active input node found');
        set({ isLoading: false });
        return null;
      }
      
      const inputData = getInputData(activeInputId);

      // Get the last sentence or use the whole input
      const sentences = inputData.currentInput.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1].trim() : inputData.currentInput;
      
      // Get memory from memoryStore
      const memoryStoreModule = await import('./memoryStore');
      const { useMemoryStore } = memoryStoreModule;
      const { memory } = useMemoryStore.getState();
      
      // Generate thought from backend
      const thoughtData = await thoughtApi.generateThought({
        event_text: lastSentence,
        event_type: triggerType,
        thoughts: get().thoughts,
        memory: memory
      });

      if (!thoughtData) {
        console.log('❌ No thought data returned from backend');
        set({ isLoading: false });
        return null;
      }
      
      // Check if this thought already exists (update case)
      const existingThoughtIndex = get().thoughts.findIndex(t => t.id === thoughtData.id);
      const isUpdate = existingThoughtIndex >= 0;
      
      if (isUpdate) {
        console.log(`🫵 Found similar thought in store: ${thoughtData.id}`);
        
        const updatedThoughts = [...get().thoughts]; 
        updatedThoughts[existingThoughtIndex] = thoughtData;
        
        set({
          thoughts: updatedThoughts,
          isLoading: false
        });
        
        // Make sure the thought is in the active list
        get().addActiveThought(thoughtData.id);
        
        return thoughtData;
      }
      
      // Add the new thought to state and the active thoughts list
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        activeThoughtIds: [...state.activeThoughtIds, thoughtData.id],
        isLoading: false
      }));


      // Update memory
      const memoryItem = await thoughtApi.createMemory({
        type: 'SHORT_TERM',
        text: "User: " + inputData.currentInput
      });
      // check if the last memory item contains "User: "
      if (memory.short_term.length > 0) { 
        if (memory.short_term[memory.short_term.length - 1].content.text.includes("User: ")) {
          memory.short_term[memory.short_term.length - 1].content.text = "User: " + inputData.currentInput;
        } else {
          memory.short_term.push(memoryItem);
        }
      } else {
        memory.short_term.push(memoryItem);
      }
        

      // Remove excess non-persistent thoughts if needed
      const { thoughts, removeThought } = get();
      let nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
      // Get max thoughts count from settings store 
      const { maxThoughtCount } = useSettingsStore.getState();
      
      if (nonPersistentThoughts.length > maxThoughtCount) {
        // Find and remove the thought with the lowest score
        const thoughtsWithScore = nonPersistentThoughts.map(t => ({
          id: t.id,
          score: t.score.saliency + t.score.weight
        }));
          
        const lowestScoreThought = thoughtsWithScore.reduce((lowest, current) => 
          current.score < lowest.score ? current : lowest
        );
        
        console.log(`🗑 Removing thought ${lowestScoreThought.id} due to exceeding max count (${maxThoughtCount})`);
        removeThought(lowestScoreThought.id);
      }
      
      // Apply time decay to older thoughts
      const updatedThoughts = get().thoughts.map(thought => {
        if (thought.id !== thoughtData.id && !thought.config.persistent) {
          const thoughtCopy = { ...thought };
          thoughtCopy.score.saliency = Math.max(0, thought.score.saliency - get().decay);
          return thoughtCopy;
        }
        return thought;
      });
      
      set({ thoughts: updatedThoughts });
      
      return thoughtData;
    } catch (error) {
      console.error('Error generating thought:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  // Helper for common thought operations
  operateOnThought: async (thoughtId: string, operation: string, options = {}) => {
    try {
      set({ isLoading: true });
      
      const thought = get().thoughts.find(t => t.id === thoughtId);
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        set({ isLoading: false });
        return;
      }
      
      const result = await thoughtApi.operateOnThought({
        operation,
        thoughts: [thought],
        options
      });
      
      const updatedThought = Array.isArray(result) ? result[0] : result;
      get().updateThought(thoughtId, updatedThought);
      
      set({ isLoading: false });
    } catch (error) {
      console.error(`Error handling ${operation} for thought ${thoughtId}:`, error);
      set({ isLoading: false });
    }
  },
  
  // Handle like/dislike/pin operations using the common helper
  handleThoughtLike: async (thoughtId: string) => {
    return get().operateOnThought(thoughtId, 'like', { amount: get().likeAmount });
  },
  
  handleThoughtDislike: async (thoughtId: string) => {
    return get().operateOnThought(thoughtId, 'dislike', { amount: get().likeAmount });
  },

  handleThoughtPin: async (thoughtId: string) => {
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    const operation = thought.config.persistent ? "unpin" : "pin";
    return get().operateOnThought(thoughtId, operation);
  },

  handleThoughtDelete: async (thoughtId: string) => {
    try {
      // When a thought is deleted, also remove it from active thoughts
      get().removeActiveThought(thoughtId);
      await get().removeThought(thoughtId);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  // Handle submitting thoughts for articulation
  handleThoughtsSubmit: async () => {
    try {
      set({ isLoading: true });
      
      const { thoughts, activeThoughtIds } = get();
      
      if (thoughts.length === 0) {
        console.log('No thoughts to articulate');
        set({ isLoading: false });
        return null;
      }
      
      console.log('📝 Articulating thoughts');
      
      // Get memory from memoryStore
      const memoryStoreModule = await import('./memoryStore');
      const { useMemoryStore } = memoryStoreModule;
      const { memory } = useMemoryStore.getState();
      
      // Articulate the thoughts into a response
      const response = await thoughtApi.articulateThoughts({
        thoughts,
        memory
      });
      
      console.log('Response received:', response);

      // Remove all thoughts that are not persistent
      // const nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
      // nonPersistentThoughts.forEach(t => get().removeThought(t.id));
      
      // Signal that response is ready
      const onResponseCreated = get().onResponseCreated;
      if (onResponseCreated && response.response) {
        // Just pass the content, the hook will handle positioning
        onResponseCreated(response.response);
      }

      set({ isLoading: false });
      return response.response;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      set({ isLoading: false });
      return null;
    }
  },

  // HELPER FUNCTIONS
  updateThought: (thoughtId: string, updatedThought: Thought) => {
    set((state) => ({
      thoughts: state.thoughts.map((thought) =>
        thought.id === thoughtId ? updatedThought : thought
      )
    }));
  },
  
  removeThought: async (thoughtId: string) => {
    try {
      // Mark the thought as being removed (for animation)
      get().markThoughtAsRemoving(thoughtId);
        
      // Also remove from active thoughts if it's still active
      get().removeActiveThought(thoughtId);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the thought from state
      set((state) => ({
        thoughts: state.thoughts.filter(t => t.id !== thoughtId),
        // Also remove from removingThoughtIds in the same state update
        removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
      }));


    } catch (error) {
      console.error(`Error removing thought ${thoughtId}:`, error);
      get().unmarkThoughtAsRemoving(thoughtId);
    }
  },

  clearThoughts: () => {
    set({
      thoughts: [],
      removingThoughtIds: [],
      activeThoughtIds: []
    });
  },

  // Callback for ReactFlow integration
  onThoughtRemoving: undefined,
  setThoughtRemovingCallback: (callback: (thoughtId: string) => void) => {
    set({ onThoughtRemoving: callback });
  }
})); 