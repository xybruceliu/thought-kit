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
import { deleteThoughtNode, getNodeByThoughtId, markNodeForRemoval } from '../hooks/nodeConnectors';
import { computeSimilarity } from '../utils/embeddingUtils';

// Define the store state
interface ThoughtStoreState {
  // Data
  thoughts: Thought[];
  
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
  generateThought: (triggerType: EventType) => Promise<Thought | null>;
  addThought: (thought: Thought) => void;
  updateThought: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => void;
  clearThoughts: () => void;
  
  // Thought operations
  operateOnThought: (thoughtId: string, operation: string, options?: object) => Promise<void>;
  handleThoughtLike: (thoughtId: string) => Promise<void>; 
  handleThoughtDislike: (thoughtId: string) => Promise<void>;
  handleThoughtPin: (thoughtId: string) => Promise<void>;
  handleThoughtDelete: (thoughtId: string) => Promise<void>;
  handleThoughtsSubmit: () => Promise<string | null>;
  
  // Signal for response creation
  onResponseCreated?: (content: string) => string;
}

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Data
  thoughts: [],
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
  
  generateThought: async (triggerType: EventType) => {
    try {
      let returnedThought = null;
      // Get input data
      const inputStoreModule = await import('./inputStore');
      const { useInputStore } = inputStoreModule;
      const inputData = useInputStore.getState().getInputData();
      
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
        return null;
      }
      
      // Check if this thought already exists (update case)
      // Our backend returns the same thought id if the thought is similar, with UPDATED saliency
      const existingThoughtIndex = get().thoughts.findIndex(t => t.id === thoughtData.id);
      const isUpdate = existingThoughtIndex >= 0;
      
      if (isUpdate) {
        console.log(`🫵 Found similar thought in store: ${thoughtData.id}`);
        
        // Update the thought in the store
        get().updateThought(thoughtData.id, thoughtData);
        
        // Make sure the thought is in the active list
        get().addActiveThought(thoughtData.id);

        // Don't return the thought data
        returnedThought = null;
      }

      // If the thought is new, return the thought data
      else{
        returnedThought = thoughtData;
      }

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
      const { thoughts } = get();
      let nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
      // Get max thoughts count from settings store 
      const { maxThoughtCount } = useSettingsStore.getState();
      
      if (nonPersistentThoughts.length > maxThoughtCount) {
        // Find and remove the thought with the lowest score that is NOT the new thought
        const thoughtsWithScore = nonPersistentThoughts
          .filter(t => t.id !== thoughtData.id) // Exclude the newly added thought
          .map(t => ({
            id: t.id,
            score: t.score.saliency + t.score.weight
          }));
          
        const lowestScoreThought = thoughtsWithScore.reduce((lowest, current) => 
          current.score < lowest.score ? current : lowest
        );
        
        console.log(`🗑 Removing thought ${lowestScoreThought.id} due to exceeding max count (${maxThoughtCount})`);
        const node = getNodeByThoughtId(lowestScoreThought.id);
        if (node) {
          markNodeForRemoval(node.id);
          setTimeout(() => {
            deleteThoughtNode(lowestScoreThought.id);
          }, 1000);
        }
      }
      
      // Apply time decay to older thoughts
      const updatedThoughts = get().thoughts.map(thought => {
        if (thought.id !== thoughtData.id && !thought.config.persistent) {
          const thoughtCopy = { ...thought };

          let similarityThreshold = 0.2;
          
          // Check if this thought has similarity > threshold with any other thought (including the new one)
          let hasHighSimilarity = false;
          
          // Check similarity with the new thought first
          if (thought.content.embedding && thoughtData.content.embedding) {
            const similarity = computeSimilarity(thought.content.embedding, thoughtData.content.embedding);
            if (similarity > similarityThreshold) {
              hasHighSimilarity = true;
            }
          }
          
          // If not similar to the new thought, check with all other thoughts
          if (!hasHighSimilarity) {
            for (const otherThought of get().thoughts) {
              // Skip comparison with itself or the new thought (we already checked that)
              if (otherThought.id === thought.id || otherThought.id === thoughtData.id) {
                continue;
              }
              
              if (thought.content.embedding && otherThought.content.embedding) {
                const similarity = computeSimilarity(thought.content.embedding, otherThought.content.embedding);
                if (similarity > similarityThreshold) {
                  hasHighSimilarity = true;
                  break;
                }
              }
            }
          }
          
          // If no high similarity found with any thought, reduce saliency by - decay - 0.2
          // Otherwise, apply the standard decay
          if (!hasHighSimilarity) {
            console.log(`🔍 This old thought has no high similarity: ${thought.id}`);
            thoughtCopy.score.saliency = Math.max(0, thought.score.saliency - get().decay - 0.2);
          } else {
            thoughtCopy.score.saliency = Math.max(0, thought.score.saliency - get().decay);
          }
          
          return thoughtCopy;
        }
        return thought;
      });
      
      set({ thoughts: updatedThoughts });
      
      return returnedThought;
    } catch (error) {
      console.error('Error generating thought:', error);
      return null;
    }
  },
  
  // Helper for common thought operations
  operateOnThought: async (thoughtId: string, operation: string, options = {}) => {
    try {
      const thought = get().thoughts.find(t => t.id === thoughtId);
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        return;
      }
      
      const result = await thoughtApi.operateOnThought({
        operation,
        thoughts: [thought],
        options
      });
      
      const updatedThought = Array.isArray(result) ? result[0] : result;
      get().updateThought(thoughtId, updatedThought);
    } catch (error) {
      console.error(`Error handling ${operation} for thought ${thoughtId}:`, error);
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
      get().removeThought(thoughtId);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  // Handle submitting thoughts for articulation
  handleThoughtsSubmit: async () => {
    try {
      const { thoughts, activeThoughtIds } = get();
      
      if (thoughts.length === 0) {
        console.log('No thoughts to articulate');
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

      // Store AI response in memory
      if (response.response) {
        const memoryItem = await thoughtApi.createMemory({
          type: 'SHORT_TERM',
          text: "AI: " + response.response
        });
        
        // Check if the last memory item contains "AI: "
        if (memory.short_term.length > 0) {
          const lastMemory = memory.short_term[memory.short_term.length - 1];
          // If last memory isn't a user input and contains "AI: ", update it
          if (!lastMemory.content.text.includes("User: ") && lastMemory.content.text.includes("AI: ")) {
            lastMemory.content.text = "AI: " + response.response;
          } else {
            // Otherwise add as new memory
            memory.short_term.push(memoryItem);
          }
        } else {
          memory.short_term.push(memoryItem);
        }
      }
      
      // Signal that response is ready
      const onResponseCreated = get().onResponseCreated;
      if (onResponseCreated && response.response) {
        onResponseCreated(response.response);
      }

      return response.response;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      return null;
    }
  },

  // HELPER FUNCTIONS
  addThought: (thought: Thought) => {
    set((state) => ({
      thoughts: [...state.thoughts, thought]
    }));
  },

  updateThought: (thoughtId: string, updatedThought: Thought) => {
    set((state) => ({
      thoughts: state.thoughts.map((thought) =>
        thought.id === thoughtId ? updatedThought : thought
      )
    }));
  },
  
  removeThought: (thoughtId: string) => {
    try {
      // Remove from active thoughts if it's still active
      get().removeActiveThought(thoughtId);
      
      // Remove the thought from state
      set((state) => ({
        thoughts: state.thoughts.filter(t => t.id !== thoughtId)
      }));
    } catch (error) {
      console.error(`Error removing thought ${thoughtId}:`, error);
    }
  },

  clearThoughts: () => {
    set({
      thoughts: [],
      activeThoughtIds: []
    });
  },

  // Signal for response creation
  onResponseCreated: undefined
})); 