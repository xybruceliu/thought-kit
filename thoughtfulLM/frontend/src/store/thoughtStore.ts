// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { XYPosition } from 'reactflow';
import { getRandomInt } from '../utils';
import { 
  Thought, 
} from '../types/thought';
import { EventType } from '../types/event';
import { thoughtApi } from '../api/thoughtApi';
import { ThoughtNode } from '../hooks/useThoughtNodes';

// Define the store state
interface ThoughtStoreState {
  // Data
  thoughts: Thought[];
  isLoading: boolean; // Track API loading state
  
  // Node positions by thought ID
  nodePositions: Record<string, XYPosition>;
  
  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought

  // Position Management
  setNodePosition: (thoughtId: string, position: XYPosition) => void;
  getNodePosition: (thoughtId: string) => XYPosition | undefined;
  
  // Actions
  generateThought: (triggerType: EventType, position?: XYPosition) => Promise<Thought | null>;
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
}

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Data
  thoughts: [],
  removingThoughtIds: [], // Track thoughts being removed for animation
  isLoading: false, // Loading state
  nodePositions: {}, // Store node positions by thought ID
  
  // SETTINGS
  maxThoughtCount: 5, // Maximum number of thoughts to display
  decay: 0.1, // Time decay for saliency
  likeAmount: 0.2, // Amount to like a thought

  // Node Position methods
  setNodePosition: (thoughtId: string, position: XYPosition) => {
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [thoughtId]: position
      }
    }));
  },
  
  getNodePosition: (thoughtId: string) => {
    return get().nodePositions[thoughtId];
  },
  
  // Track thoughts being removed
  markThoughtAsRemoving: (thoughtId: string) => {
    set((state) => ({
      removingThoughtIds: [...state.removingThoughtIds, thoughtId]
    }));
  },
  
  unmarkThoughtAsRemoving: (thoughtId: string) => {
    set((state) => ({
      removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
    }));
  },

  generateThought: async (triggerType: EventType, position?: XYPosition) => {
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
        
        return thoughtData;
      }
      
      // Save position for new thoughts
      if (position && thoughtData.id) {
        get().setNodePosition(thoughtData.id, position);
      }
      
      // Add the new thought to state
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        isLoading: false
      }));

      // Update memory
      const memoryItem = await thoughtApi.createMemory({
        type: 'SHORT_TERM',
        text: inputData.currentInput
      });
      memory.short_term = [memoryItem];
        
      // Remove excess non-persistent thoughts if needed
      const { thoughts, removeThought } = get();
      let nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
      
      if (nonPersistentThoughts.length > get().maxThoughtCount) {
        // Find and remove the thought with the lowest score
        const thoughtsWithScore = nonPersistentThoughts.map(t => ({
          id: t.id,
          score: t.score.saliency + t.score.weight
        }));
          
        const lowestScoreThought = thoughtsWithScore.reduce((lowest, current) => 
          current.score < lowest.score ? current : lowest
        );
        
        console.log(`🗑 Removing thought ${lowestScoreThought.id} due to exceeding max count`);
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
      await get().removeThought(thoughtId);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  // Handle submitting thoughts for articulation
  handleThoughtsSubmit: async () => {
    try {
      set({ isLoading: true });
      
      const { thoughts } = get();
      
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
      nodePositions: {}
    });
  }
})); 