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
  
  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought
  
  // Actions
  generateThought: (triggerType: EventType) => Promise<Thought | null>;
  addThought: (thought: Thought) => void;
  updateThought: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => void;
  clearThoughts: () => void;
  
  // Thought activity
  setThoughtActive: (thoughtId: string, isActive: boolean) => void;
  isThoughtActive: (thoughtId: string) => boolean;
  getActiveThoughts: () => Thought[];
  
  // Thought operations
  operateOnThought: (thoughtId: string, operation: string, options?: object) => Promise<void>;
  handleThoughtLike: (thoughtId: string) => Promise<void>; 
  handleThoughtDislike: (thoughtId: string) => Promise<void>;
  handleThoughtPin: (thoughtId: string) => Promise<void>;
  handleThoughtDelete: (thoughtId: string) => Promise<void>;
  handleThoughtsSubmit: () => Promise<string | null>;
  
  // Get thoughts by IDs
  getThoughtsByIds: (thoughtIds: string[]) => Thought[];
  
  // Signal for response creation
  onResponseCreated?: (content: string) => string;
}

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Data
  thoughts: [],
  
  // SETTINGS
  maxThoughtCount: useSettingsStore.getState().maxThoughtCount,
  decay: useSettingsStore.getState().decay,
  likeAmount: useSettingsStore.getState().likeAmount, 
  
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
      
      // Generate thought from backend - use current active thoughts
      const thoughtData = await thoughtApi.generateThought({
        event_text: lastSentence,
        event_type: triggerType,
        thoughts: get().getActiveThoughts(), // Get fresh list of active thoughts
        memory: memory
      });

      if (!thoughtData) {
        console.log('❌ No thought data returned from backend');
        return null;
      }
      
      // Get a fresh snapshot of active thoughts for each operation
      const currentActiveThoughts = get().getActiveThoughts();
      
      // Check if this thought already exists (update case)
      // Our backend returns the same thought id if the thought is similar, with UPDATED saliency
      const existingThoughtIndex = currentActiveThoughts.findIndex(t => t.id === thoughtData.id);
      const isUpdate = existingThoughtIndex >= 0;
      
      if (isUpdate) {
        console.log(`🫵 Found similar thought in store: ${thoughtData.id}`);
        
        // Update the thought in the store
        get().updateThought(thoughtData.id, thoughtData);
        
        // Make sure the thought is in the active list
        get().setThoughtActive(thoughtData.id, true);

        // Don't return the thought data
        returnedThought = null;
      }

      // If the thought is new, return the thought data
      else{
        // Initialize is_active for new thoughts
        if (thoughtData && !('is_active' in thoughtData)) {
          (thoughtData as Thought).is_active = true;
        }
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
        
      // Check if we need to remove excess thoughts BEFORE adding the new thought
      if (!isUpdate) {
        // Get fresh list of active thoughts again
        const currentActiveThoughts = get().getActiveThoughts();
        let nonPersistentThoughts = currentActiveThoughts.filter(t => !t.config.persistent);
        
        // Get max thoughts count from settings store 
        const { maxThoughtCount } = useSettingsStore.getState();
        
        // Account for the new thought we're about to add
        if (nonPersistentThoughts.length >= maxThoughtCount) {
          // Find and remove the thought with the lowest score
          const thoughtsWithScore = nonPersistentThoughts.map(t => ({
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
      }
      
      // Apply time decay to the current active thoughts (get fresh list again)
      const activeThoughtsForDecay = get().getActiveThoughts();
      const updatedThoughts = activeThoughtsForDecay.map(thought => {
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
            for (const otherThought of activeThoughtsForDecay) {
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
      
      // Update thoughts individually instead of replacing all thoughts
      for (const thought of updatedThoughts) {
        get().updateThought(thought.id, thought);
      }
      
      return returnedThought;
    } catch (error) {
      console.error('Error generating thought:', error);
      return null;
    }
  },
  
  // Helper for common thought operations
  operateOnThought: async (thoughtId: string, operation: string, options = {}) => {
    try {
      const activeThoughts = get().getActiveThoughts();
      const thought = activeThoughts.find(t => t.id === thoughtId);
      
      if (!thought) {
        console.error(`Thought with ID ${thoughtId} not found in store`);
        return;
      }
      
      // Only send the specific thought we're operating on, not all active thoughts
      const result = await thoughtApi.operateOnThought({
        operation,
        thoughts: [thought], // Only send the specific thought we're operating on
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
    const activeThoughts = get().getActiveThoughts();
    const thought = activeThoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    const operation = thought.config.persistent ? "unpin" : "pin";
    return get().operateOnThought(thoughtId, operation);
  },

  handleThoughtDelete: async (thoughtId: string) => {
    try {
      // set the thought as inactive
      get().setThoughtActive(thoughtId, false);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  // Handle submitting thoughts for articulation
  handleThoughtsSubmit: async () => {
    try {
      const activeThoughts = get().getActiveThoughts();
      
      if (activeThoughts.length === 0) {
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
        thoughts: activeThoughts,
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

      // Return the response text only
      return response.response;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      return null;
    }
  },

  // HELPER FUNCTIONS
  addThought: (thought: Thought) => {
    // Ensure thought has is_active property (for backwards compatibility)
    const thoughtWithActive = {
      ...thought,
      is_active: thought.is_active !== undefined ? thought.is_active : false
    };
    
    set((state) => ({
      thoughts: [...state.thoughts, thoughtWithActive]
    }));
  },

  updateThought: (thoughtId: string, updatedThought: Thought) => {
    set((state) => ({
      thoughts: state.thoughts.map((thought) => {
        if (thought.id === thoughtId) {
          // Preserve the is_active property from the existing thought
          return { 
            ...updatedThought, 
            is_active: thought.is_active !== undefined ? thought.is_active : false
          };
        }
        return thought;
      })
    }));
  },
  
  removeThought: (thoughtId: string) => {
    // Remove the thought from state
    set((state) => ({
      thoughts: state.thoughts.filter(t => t.id !== thoughtId)
    }));
  },

  clearThoughts: () => {
    set({
      thoughts: []
    });
  },

  // Signal for response creation
  onResponseCreated: undefined,

  // Thought activity
  setThoughtActive: (thoughtId: string, isActive: boolean) => {
    set((state) => ({
      thoughts: state.thoughts.map((thought) =>
        thought.id === thoughtId ? { ...thought, is_active: isActive } : thought
      )
    }));
  },

  isThoughtActive: (thoughtId: string) => {
    return get().thoughts.find(t => t.id === thoughtId)?.is_active === true;
  },

  getActiveThoughts: () => {
    return get().thoughts.filter(t => t.is_active === true);
  },

  // Get thoughts by IDs
  getThoughtsByIds: (thoughtIds: string[]) => {
    return get().thoughts.filter(t => thoughtIds.includes(t.id));
  }
})); 