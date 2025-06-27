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
import { computeSimilarity, findSimilarThought } from '../utils/embeddingUtils';

// Define the store state
interface ThoughtStoreState {
  // Data
  thoughts: Thought[];
  
  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for weight
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
  handleThoughtLike: (thoughtId: string) => Promise<void>; 
  handleThoughtDislike: (thoughtId: string) => Promise<void>;
  handleThoughtPin: (thoughtId: string) => Promise<void>;
  handleThoughtDelete: (thoughtId: string) => Promise<void>;
  handleThoughtComment: (thoughtId: string, comment: string) => void;
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
      
      // Generate thought from backend (backend uses thoughts for context, not similarity checking)
      const newThought = await thoughtApi.generateThought({
        event_text: lastSentence,
        event_type: triggerType,
        thoughts: get().getActiveThoughts(), // Send for context/generation quality
        memory: memory
      });

      if (!newThought) {
        console.log('❌ No thought data returned from backend');
        return null;
      }
      
      // Check for similarity against existing active thoughts (frontend-only)
      const currentActiveThoughts = get().getActiveThoughts();
      const similarThought = findSimilarThought(newThought, currentActiveThoughts, 0.7);
      
      let returnedThought: Thought | null = null;
      let updatedThoughtId: string | null = null;
      
      if (similarThought) {
        console.log(`🫵 Found similar thought in store: ${similarThought.id}`);
        
        // Update the existing similar thought
        const updatedThought = {
          ...similarThought,
          score: {
            ...similarThought.score,
            weight: Math.min(similarThought.score.weight + 0.2, 1.0)
          }
        };
        
        get().updateThought(similarThought.id, updatedThought);
        get().setThoughtActive(similarThought.id, true);
        
        updatedThoughtId = similarThought.id;
        returnedThought = null;
      } else {
        // Initialize is_active for new thoughts
        if (newThought && !('is_active' in newThought)) {
          (newThought as Thought).is_active = true;
        }
        returnedThought = newThought;
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
      if (returnedThought) { // Only check if we're adding a new thought
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
            score: t.score.weight
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
        // Skip decay for new thoughts, updated thoughts, and persistent thoughts
        const shouldSkip = (returnedThought && thought.id === returnedThought.id) || 
                          (updatedThoughtId && thought.id === updatedThoughtId) || 
                          thought.config.persistent;
        
        if (!shouldSkip) {
          const thoughtCopy = { ...thought };

          let similarityThreshold = 0.2;
          
          // Check if this thought has similarity > threshold with any other thought (including the new one)
          let hasHighSimilarity = false;
          
          // Check similarity with the new thought first (if we have one)
          if (returnedThought && thought.content.embedding && returnedThought.content.embedding) {
            const similarity = computeSimilarity(thought.content.embedding, returnedThought.content.embedding);
            if (similarity > similarityThreshold) {
              hasHighSimilarity = true;
            }
          }
          
          // If not similar to the new thought, check with all other thoughts
          if (!hasHighSimilarity) {
            for (const otherThought of activeThoughtsForDecay) {
              // Skip comparison with itself or the new thought (we already checked that)
              if (otherThought.id === thought.id || (returnedThought && otherThought.id === returnedThought.id)) {
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
          
          // If no high similarity found with any thought, reduce weight by - decay - 0.2
          // Otherwise, apply the standard decay
          if (!hasHighSimilarity) {
            console.log(`🔍 This old thought has no high similarity: ${thought.id}`);
            thoughtCopy.score.weight = Math.max(0, thought.score.weight - get().decay - 0.2);
          } else {
            thoughtCopy.score.weight = Math.max(0, thought.score.weight - get().decay);
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
  
  // Handle like/dislike/pin operations with optimistic updates
  handleThoughtLike: async (thoughtId: string) => {
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought || thought.config.interactivity === "VIEW") return;
    
    // Optimistic update: immediately update UI
    const likeAmount = get().likeAmount;
    const newWeight = Math.min(thought.score.weight + likeAmount, 1.0);
    const updatedThought = { 
      ...thought, 
      score: { ...thought.score, weight: Math.round(newWeight * 100) / 100 }
    };
    get().updateThought(thoughtId, updatedThought);
  },
  
  handleThoughtDislike: async (thoughtId: string) => {
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought || thought.config.interactivity === "VIEW") return;
    
    // Optimistic update: immediately update UI  
    const likeAmount = get().likeAmount;
    const newWeight = Math.max(thought.score.weight - likeAmount, 0.0);
    const updatedThought = { 
      ...thought, 
      score: { ...thought.score, weight: Math.round(newWeight * 100) / 100 }
    };
    get().updateThought(thoughtId, updatedThought);
  },

  handleThoughtPin: async (thoughtId: string) => {
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    // Optimistic update: immediately toggle pin state
    const updatedThought = { 
      ...thought, 
      config: { ...thought.config, persistent: !thought.config.persistent }
    };
    get().updateThought(thoughtId, updatedThought);
  },

  handleThoughtDelete: async (thoughtId: string) => {
    try {
      // set the thought as inactive
      get().setThoughtActive(thoughtId, false);
    } catch (error) {
      console.error(`Error handling thought deletion for ${thoughtId}:`, error);
    }
  },
  
  handleThoughtComment: (thoughtId: string, comment: string) => {
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    
    const updatedThought = { 
      ...thought, 
      user_comments: [...thought.user_comments, comment]
    };
    get().updateThought(thoughtId, updatedThought);
  },
  
  // Handle submitting thoughts for articulation
  handleThoughtsSubmit: async () => {
    try {
      const activeThoughts = get().getActiveThoughts();
      
      console.log('📝 Articulating thoughts');
      
      // Get memory from memoryStore
      const memoryStoreModule = await import('./memoryStore');
      const { useMemoryStore } = memoryStoreModule;
      const { memory } = useMemoryStore.getState();

      // Articulate the thoughts into a response (even if no active thoughts)
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