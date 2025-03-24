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
  maxThoughtCount: number; // Maximum number of thoughts to display
  removingThoughtIds: string[]; // Track thoughts being removed for animation
  isLoading: boolean; // Track API loading state
  timeDecay: number; // Time decay for saliency
  likeAmount: number; // Amount to like a thought

  // Actions
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => Promise<Thought | null>;
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => void;
  updateThoughtNodeState: (thoughtId: string, updatedThought: Thought) => void;
  removeThought: (thoughtId: string) => Promise<void>;
  fetchAllThoughts: () => Promise<void>;

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
  timeDecay: 0.2, // Time decay for saliency
  likeAmount: 0.2, // Amount to like a thought
  
  generateThoughtAtPosition: async (triggerType: EventType, position?: XYPosition) => {
    try {
      set({ isLoading: true });
      
      // Use the input store to get the current input
      const inputStoreModule = await import('./inputStore');
      const { useInputStore } = inputStoreModule;
      const { currentInput } = useInputStore.getState();
      
      // Call the backend API to generate a thought
      const thoughtData = await thoughtApi.generateThought({
        event_text: currentInput,
        event_type: triggerType
      });

      // If the response is null, return null
      if (!thoughtData) {
        console.log('No thought data returned from backend');
        set({ isLoading: false });
        return null;
      }
      
      // Check if this thought already exists in our store (update case)
      const existingThoughtIndex = get().thoughts.findIndex(t => t.id === thoughtData.id);
      const isUpdate = existingThoughtIndex >= 0;
      
      if (isUpdate) {
        console.log(`Found similar thought in store: ${thoughtData.id}: ${thoughtData.content.text}`);

        // Create an update with all the thought's properties
        const updates = {
          weight: thoughtData.score.weight,
          saliency: thoughtData.score.saliency,
          persistent: thoughtData.config.persistent,
          interactivity: thoughtData.config.interactivity as 'VIEW' | 'COMMENT' | 'EDIT',
          content_text: thoughtData.content.text
        };
        
        try {
          // Use API to update backend, then update state
          const updatedThought = await thoughtApi.updateThought(thoughtData.id, updates);
          get().updateThoughtNodeState(thoughtData.id, updatedThought);
        } catch (error) {
          console.error(`Error updating thought ${thoughtData.id}:`, error);
        } finally {
          set({ isLoading: false });
        }
        
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
      
      // Decrease saliency of other thoughts by the time decay
      // This is a time decay applied to older thoughts
      const otherThoughts = get().thoughts.filter(t => t.id !== thoughtData.id);
      
      // Process each thought update sequentially to avoid race conditions
      for (const thought of otherThoughts) {
        try {
          const newSaliency = Math.max(0, thought.score.saliency - get().timeDecay);
          const updatedThought = await thoughtApi.updateThought(thought.id, { 
            saliency: newSaliency 
          });
          get().updateThoughtNodeState(thought.id, updatedThought);
        } catch (error) {
          console.error(`Error decreasing saliency for thought ${thought.id}:`, error);
        }
      }
      
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
        
        // Remove the lowest-scoring thought (this will call the backend API)
        await removeThought(lowestScoreThought.id);
      }
      
      return thoughtData;
    } catch (error) {
      console.error('Error generating thought:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => {
    set((state) => ({
      thoughtNodes: state.thoughtNodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  },

  // Function to update only the frontend state
  updateThoughtNodeState: (thoughtId: string, updatedThought: Thought) => {
    set((state) => ({
      thoughts: state.thoughts.map(t => 
        t.id === thoughtId ? updatedThought : t
      ),
      thoughtNodes: state.thoughtNodes.map(node => 
        node.id === thoughtId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                content: updatedThought.content.text,
                thought: updatedThought 
              } 
            } 
          : node
      )
    }));
  },
  
  removeThought: async (thoughtId: string) => {
    try {
      // Check if thought is already being removed
      if (get().removingThoughtIds.includes(thoughtId)) {
        console.log(`Thought ${thoughtId} is already being removed, skipping duplicate removal`);
        return;
      }
      
      // Mark thought as removing for animation
      set((state) => ({
        removingThoughtIds: [...state.removingThoughtIds, thoughtId]
      }));
      
      // Delay removal to allow for animation to complete
      setTimeout(async () => {
        try {
          // Call the backend API to remove the thought
          await thoughtApi.deleteThought(thoughtId);
          
          // Update state by removing the thought and node
          set((state) => ({
            thoughts: state.thoughts.filter(t => t.id !== thoughtId),
            thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
            removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
          }));
        } catch (error) {
          console.error(`Error removing thought ${thoughtId}:`, error);
          // Remove from removing list even if API call fails
          set((state) => ({
            removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
          }));
        }
      }, 1000); // 1000ms to match the exit animation duration
    } catch (error) {
      console.error('Error initiating thought removal:', error);
    }
  },
  
  fetchAllThoughts: async () => {
    try {
      set({ isLoading: true });
      
      // Call the backend API to get all thoughts
      const thoughts = await thoughtApi.getAllThoughts();
      
      // Create thought nodes for all thoughts
      const thoughtNodes = thoughts.map(thought => createThoughtNode(thought));
      
      // Update state with fetched thoughts
      set({
        thoughts,
        thoughtNodes,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching thoughts:', error);
      set({ isLoading: false });
    }
  },
  
  // Simplified handler for thought bubble clicks
  handleThoughtClick: async (thoughtId: string) => {
    try {
      const thought = get().thoughts.find(t => t.id === thoughtId);
      
      if (!thought) {
        console.error(`Thought ${thoughtId} not found`);
        return;
      }
      
      // Use the "like" operation with amount 0.2
      const result = await thoughtApi.operateOnThought({
        operation: "like",
        thoughts: [thought],
        options: {
          amount: get().likeAmount
        }
      });
      
      // Get the updated thought from the result
      const updatedThought = Array.isArray(result) ? result[0] : result;
      
      // Update in local state using the shared state update function
      // No delay needed anymore as we handle transitions in the component
      get().updateThoughtNodeState(thoughtId, updatedThought);
      
      console.log(`Liked thought ${thoughtId}, new weight: ${updatedThought.score.weight}`);
    } catch (error) {
      console.error(`Error handling click for thought ${thoughtId}:`, error);
    }
  }
})); 