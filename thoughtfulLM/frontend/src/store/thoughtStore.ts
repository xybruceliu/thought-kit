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
  
  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought

  // Actions
  generateThought: (triggerType: EventType) => Promise<Thought | null>;
  updateThought: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => Promise<void>;
  clearThoughts: () => void;
  
  handleThoughtLike: (thoughtId: string) => Promise<void>; 
  handleThoughtDislike: (thoughtId: string) => Promise<void>;
  handleThoughtPin: (thoughtId: string) => Promise<void>;
  handleThoughtDelete: (thoughtId: string) => Promise<void>;
  handleThoughtsSubmit: () => Promise<void>;
  
  // Track thoughts being removed for animation (just the ids, not the nodes)
  removingThoughtIds: string[];
  markThoughtAsRemoving: (thoughtId: string) => void;
  unmarkThoughtAsRemoving: (thoughtId: string) => void;
}

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Data
  thoughts: [],
  removingThoughtIds: [], // Track thoughts being removed for animation
  isLoading: false, // Loading state

  // SETTINGS
  maxThoughtCount: 5, // Maximum number of thoughts to display
  decay: 0.1, // Time decay for saliency
  likeAmount: 0.2, // Amount to like a thought

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

  generateThought: async (triggerType: EventType) => {
    try {
      set({ isLoading: true });

      // GENERATE THOUGHT
      // Use the input store to get the current input
      const inputStoreModule = await import('./inputStore');
      const { useInputStore } = inputStoreModule;
      const { activeInputId, getInputData } = useInputStore.getState();
      
      // Make sure we have an active input
      if (!activeInputId) {
        console.error('No active input node found');
        set({ isLoading: false });
        return null;
      }
      
      const inputData = getInputData(activeInputId);

      // get the last sentence of the current input, split by . or ! or ?
      const sentences = inputData.currentInput.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1].trim() : inputData.currentInput;
      
      // Get memory from memoryStore for the API call
      const memoryStoreModule = await import('./memoryStore');
      const { useMemoryStore } = memoryStoreModule;
      const { memory } = useMemoryStore.getState();
      
      // Call the backend API to generate a thought
      const thoughtData = await thoughtApi.generateThought({
        event_text: lastSentence,
        event_type: triggerType,
        thoughts: get().thoughts, // Send all current thoughts to backend
        memory: memory // Send all current memory to backend
      });

      // If the response is null, return null
      if (!thoughtData) {
        console.log('❌ No thought data returned from backend');
        set({ isLoading: false });
        return null;
      }
      
      // Check if this thought already exists in our store (update case)
      const existingThoughtIndex = get().thoughts.findIndex(t => t.id === thoughtData.id);
      const isUpdate = existingThoughtIndex >= 0;
      
      if (isUpdate) {
        console.log(`🫵 Found similar thought in store: ${thoughtData.id}: ${thoughtData.content.text}`);
        
        // Update the thought in our local store
        const updatedThoughts = [...get().thoughts]; 
        updatedThoughts[existingThoughtIndex] = thoughtData;
        
        set({
          thoughts: updatedThoughts,
          isLoading: false
        });
        
        return thoughtData;
      }
      
      // Add the new thought to state
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        isLoading: false
      }));

      // UPDATE MEMORY
      // In this research prototype, we just set the first item in short-term memory as the current input 
      const memoryItem = await thoughtApi.createMemory({
        type: 'SHORT_TERM',
        text: inputData.currentInput
      });
      memory.short_term = [memoryItem];
        
      // CHECK IF WE NEED TO REMOVE A THOUGHT
      // Check if we need to remove a thought (non-persistent thoughts exceeded max count)
      const { thoughts, removeThought } = get();
      let nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
      if (nonPersistentThoughts.length > get().maxThoughtCount) {
        // get the saliency + weight for each thought
        const thoughtsWithScore = nonPersistentThoughts.map(t => ({
            id: t.id,
            score: t.score.saliency + t.score.weight
          }));
          
        // Find the thought with the lowest score
        const lowestScoreThought = thoughtsWithScore.reduce((lowest, current) => 
          current.score < lowest.score ? current : lowest
        );
        
        // Remove the thought with the lowest score
        console.log(`🗑 Removing thought ${lowestScoreThought.id} due to exceeding max count`);
        removeThought(lowestScoreThought.id);
      }
      
      // Decrease saliency of other thoughts by the time decay if thought is non-persistent
      // This is a time decay applied to older thoughts
      const updatedThoughts = get().thoughts.map(thought => {
        if (thought.id !== thoughtData.id && !thought.config.persistent) {
          const thoughtCopy = { ...thought };
          thoughtCopy.score.saliency = Math.max(0, thought.score.saliency - get().decay);
          return thoughtCopy;
        }
        return thought;
      });
      
      // Update all thoughts in state
      set({ thoughts: updatedThoughts });
      
      return thoughtData;
    } catch (error) {
      console.error('Error generating thought:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  // Handle a click on the right side of a thought node (like)
  handleThoughtLike: async (thoughtId: string) => {
    try {
      set({ isLoading: true });
      
      // Get the thought from the store
      const thought = get().thoughts.find(t => t.id === thoughtId);
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        set({ isLoading: false });
        return;
      }
      
      // Use the API to operate on the thought
      const result = await thoughtApi.operateOnThought({
        operation: 'like',
        thoughts: [thought],
        options: {
          amount: get().likeAmount
        }
      });
      
      // The result might be a single thought or an array of thoughts
      const updatedThought = Array.isArray(result) ? result[0] : result;
      
      // Update the thought in our store
      get().updateThought(thoughtId, updatedThought);
      
      set({ isLoading: false });
    } catch (error) {
      console.error(`Error handling thought click for ${thoughtId}:`, error);
      set({ isLoading: false });
    }
  },
  
  // Handle a click on the left side of a thought node (dislike)
  handleThoughtDislike: async (thoughtId: string) => {
    try {
      set({ isLoading: true });
      
      // Get the thought from the store
      const thought = get().thoughts.find(t => t.id === thoughtId);
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        set({ isLoading: false });
        return;
      }
      
      // Use the API to operate on the thought
      const result = await thoughtApi.operateOnThought({
        operation: 'dislike',
        thoughts: [thought],
        options: {
          amount: get().likeAmount // use the same amount but the operation is different
        }
      });
      
      // The result might be a single thought or an array of thoughts
      const updatedThought = Array.isArray(result) ? result[0] : result;
      
      // Update the thought in our store
      get().updateThought(thoughtId, updatedThought);
      
      set({ isLoading: false });
    } catch (error) {
      console.error(`Error handling thought dislike for ${thoughtId}:`, error);
      set({ isLoading: false });
    }
  },

  // Handle pinning/unpinning a thought
  handleThoughtPin: async (thoughtId: string) => {
    try {
      set({ isLoading: true });
      
      // Get the thought from the store
      const thought = get().thoughts.find(t => t.id === thoughtId);
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        set({ isLoading: false });
        return;
      }
      
      // Determine which operation to use based on current state
      const operation = thought.config.persistent ? "unpin" : "pin";
      
      // Use the API to operate on the thought
      const result = await thoughtApi.operateOnThought({
        operation: operation,
        thoughts: [thought],
        options: {}
      });
      
      // The result might be a single thought or an array of thoughts
      const updatedThought = Array.isArray(result) ? result[0] : result;
      
      // Update the thought in our store
      get().updateThought(thoughtId, updatedThought);
      
      set({ isLoading: false });
    } catch (error) {
      console.error(`Error pinning/unpinning thought ${thoughtId}:`, error);
      set({ isLoading: false });
    }
  },

  // Handle deleting a thought
  handleThoughtDelete: async (thoughtId: string) => {
    try {
      // Just call the existing removeThought method
      await get().removeThought(thoughtId);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  // Handle submitting thoughts to be articulated by the backend
  handleThoughtsSubmit: async () => {
    try {
      set({ isLoading: true });
      
      // Get current thoughts from the store
      const { thoughts } = get();
      
      // Check if there are any thoughts to articulate
      if (thoughts.length === 0) {
        console.log('No thoughts to articulate');
        set({ isLoading: false });
        return;
      }
      
      console.log('📝 Submitting thoughts for articulation');
      
      // Get memory from memoryStore for context
      const memoryStoreModule = await import('./memoryStore');
      const { useMemoryStore } = memoryStoreModule;
      const { memory } = useMemoryStore.getState();
      
      // Call the backend API to articulate thoughts
      const result = await thoughtApi.articulateThoughts({
        thoughts: thoughts,
        memory: memory
      });
      
      // Handle the result
      if (result) {
        console.log('✅ Thoughts successfully articulated:', result);
        
        // Here we could update the UI or store with the articulated result
        // This will be connected to the frontend later
      } else {
        console.error('❌ Failed to articulate thoughts');
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      set({ isLoading: false });
    }
  },

  // HELPER FUNCTIONS
  // Update the state of a thought
  updateThought: (thoughtId: string, updatedThought: Thought) => {
    set((state) => ({
      thoughts: state.thoughts.map((thought) =>
        thought.id === thoughtId ? updatedThought : thought
      )
    }));
  },
  
  // Remove a thought from the store
  removeThought: async (thoughtId: string) => {
    try {
      // Mark the thought as being removed (for animation)
      get().markThoughtAsRemoving(thoughtId);
      
      // Wait a moment for the animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the thought and unmark it
      set((state) => ({
        thoughts: state.thoughts.filter(t => t.id !== thoughtId),
      }));
      
      get().unmarkThoughtAsRemoving(thoughtId);
    } catch (error) {
      console.error(`Error removing thought ${thoughtId}:`, error);
      // Unmark in case of error
      get().unmarkThoughtAsRemoving(thoughtId);
    }
  },

  clearThoughts: () => {
    // Clear all thoughts
    set({
      thoughts: [],
      removingThoughtIds: []
    });
  }
})); 