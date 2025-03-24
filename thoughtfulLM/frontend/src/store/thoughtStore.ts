// Zustand store for managing thoughts
// This file will handle global state management for the application

import { create } from 'zustand';
import { Node, XYPosition } from 'reactflow';
import { getRandomInt } from '../utils';
import { 
  Thought, 
} from '../types/thought';
import { EventType } from '../types/event';
import { thoughtApi } from '../api/thoughtApi';

// ReactFlow node for thought bubble visualization
export interface ThoughtNode extends Node {
  id: string;
  type: 'thoughtBubble';
  position: XYPosition;
  data: {
    content: string;
    thought: Thought;
    blobVariant: number;
  };
}

// Define the store state
interface ThoughtStoreState {
  // Thoughts and nodes
  thoughts: Thought[];
  thoughtNodes: ThoughtNode[];
  removingThoughtIds: string[]; // Track thoughts being removed for animation
  isLoading: boolean; // Track API loading state

  // Settings
  maxThoughtCount: number; // Maximum number of thoughts to display
  decay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought

  // Actions
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => Promise<Thought | null>;
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => void;
  updateThought: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => Promise<void>;
  clearThoughts: () => void;
  handleThoughtClick: (thoughtId: string) => Promise<void>; 
}

// Create a ThoughtNode from a Thought
const createThoughtNode = (thought: Thought, position?: XYPosition): ThoughtNode => {
  // Use provided position or generate random position
  const x = position?.x ?? getRandomInt(100, 700);
  const y = position?.y ?? getRandomInt(100, 500);
  
  return {
    id: thought.id,
    type: 'thoughtBubble',
    position: { x, y },
    data: {
      content: thought.content.text,
      thought,
      blobVariant: getRandomInt(0, 5),
    },
  };
};

// Create the store
export const useThoughtStore = create<ThoughtStoreState>((set, get) => ({
  // Thoughts and nodes
  thoughts: [],
  thoughtNodes: [],
  removingThoughtIds: [], // Initially empty
  isLoading: false, // Loading state

  // SETTINGS
  maxThoughtCount: 5, // Maximum number of thoughts to display
  decay: 0.1, // Time decay for saliency
  likeAmount: 0.2, // Amount to like a thought

  generateThoughtAtPosition: async (triggerType: EventType, position?: XYPosition) => {
    try {
      set({ isLoading: true });

      // GENERATE THOUGHT
      // Use the input store to get the current input
      const inputStoreModule = await import('./inputStore');
      const { useInputStore } = inputStoreModule;
      const { currentInput } = useInputStore.getState();

      // get the last sentence of the current input, split by . or ! or ?
      const sentences = currentInput.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1].trim() : currentInput;
      
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
        
        // Also update the node
        get().updateThought(thoughtData.id, thoughtData);
        
        return thoughtData;
      }
      
      // This is a new thought - create a node for it
      const thoughtNode = createThoughtNode(thoughtData, position);
      
      // Add the new thought and node to state
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        thoughtNodes: [...state.thoughtNodes, thoughtNode],
        isLoading: false
      }));


      // UPDATE MEMORY
      // In this research prototype, we just set the first item in short-term memory as the current input 
      const memoryItem = await thoughtApi.createMemory({
        type: 'SHORT_TERM',
        text: lastSentence
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
      
      // Decrease saliency of other thoughts by the time decay
      // This is a time decay applied to older thoughts
      const updatedThoughts = get().thoughts.map(thought => {
        if (thought.id !== thoughtData.id) {
          const thoughtCopy = { ...thought };
          thoughtCopy.score.saliency = Math.max(0, thought.score.saliency - get().decay);
          // Update the node state too
          get().updateThought(thought.id, thoughtCopy);
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
  
  // Handle a click on a thought node
  handleThoughtClick: async (thoughtId: string) => {
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


  // HELPER FUNCTIONS
  // Update the position of a thought node
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => {
    set((state) => ({
      thoughtNodes: state.thoughtNodes.map((node) => 
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  },
  
  // Update the state of a thought node
  updateThought: (thoughtId: string, updatedThought: Thought) => {
    set((state) => {
      // First update the thought in the thoughts array
      const updatedThoughts = state.thoughts.map((thought) =>
        thought.id === thoughtId ? updatedThought : thought
      );
      
      // Then update the node data
      const updatedThoughtNodes = state.thoughtNodes.map((node) => {
        if (node.id === thoughtId) {
          return {
            ...node,
            data: {
              ...node.data,
              content: updatedThought.content.text,
              thought: updatedThought
            }
          };
        }
        return node;
      });
      
      return {
        thoughts: updatedThoughts,
        thoughtNodes: updatedThoughtNodes
      };
    });
  },
  
  // Remove a thought from the store
  removeThought: async (thoughtId: string) => {
    try {
      // Mark the thought as being removed (for animation)
      set((state) => ({
        removingThoughtIds: [...state.removingThoughtIds, thoughtId]
      }));
      
      // Wait a moment for the animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the thought and its node
      set((state) => ({
        thoughts: state.thoughts.filter(t => t.id !== thoughtId),
        thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
        removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
      }));
    } catch (error) {
      console.error(`Error removing thought ${thoughtId}:`, error);
      // Remove from removing list in case of error
      set((state) => ({
        removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
      }));
    }
  },

  clearThoughts: () => {
    // Clear all thoughts
    set({
      thoughts: [],
      thoughtNodes: [],
      removingThoughtIds: []
    });
  }

})); 