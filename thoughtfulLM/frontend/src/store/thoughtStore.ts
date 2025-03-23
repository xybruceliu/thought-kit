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

  // Actions
  generateThoughtAtPosition: (triggerType: EventType, position?: XYPosition) => Promise<Thought | null>;
  updateThoughtNodePosition: (nodeId: string, position: XYPosition) => void;
  removeThought: (thoughtId: string) => Promise<void>;
  fetchAllThoughts: () => Promise<void>;
  getThought: (thoughtId: string) => Promise<Thought | null>;
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
  maxThoughtCount: 5, // Maximum number of thoughts to display
  removingThoughtIds: [], // Initially empty
  isLoading: false, // Loading state
  
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
      
      // Create a thought node for visualization
      const thoughtNode = createThoughtNode(thoughtData, position);
      
      // Add the new thought and node to state
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        thoughtNodes: [...state.thoughtNodes, thoughtNode],
        isLoading: false
      }));
      
      // Check if we need to remove a thought (exceeded max count)
      const { thoughts, removeThought } = get();
      if (thoughts.length > get().maxThoughtCount) {
        // Find non-persistent thoughts
        const nonPersistentThoughts = thoughts.filter(t => !t.config.persistent);
        
        if (nonPersistentThoughts.length > 0) {
          // get the saliency score for each thought
          const thoughtsWithScore = nonPersistentThoughts.map(t => ({
            id: t.id,
            saliency: t.score.saliency
          }));
          
          // Find the thought with the lowest score
          const lowestScoreThought = thoughtsWithScore.reduce((lowest, current) => 
            current.saliency < lowest.saliency ? current : lowest
          );
          
          // Remove the lowest-scoring thought (this will call the backend API)
          await removeThought(lowestScoreThought.id);
        }
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
  
  getThought: async (thoughtId: string) => {
    try {
      // Check if thought exists in local state first
      const existingThought = get().thoughts.find(t => t.id === thoughtId);
      if (existingThought) return existingThought;
      
      // If not found locally, fetch from backend
      const thought = await thoughtApi.getThought(thoughtId);
      
      // Add to local state if not already there
      set((state) => {
        if (!state.thoughts.some(t => t.id === thought.id)) {
          return {
            thoughts: [...state.thoughts, thought],
            thoughtNodes: [
              ...state.thoughtNodes,
              createThoughtNode(thought)
            ]
          };
        }
        return state;
      });
      
      return thought;
    } catch (error) {
      console.error(`Error getting thought ${thoughtId}:`, error);
      return null;
    }
  }
})); 