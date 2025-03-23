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
  setMaxThoughtCount: (count: number) => Promise<void>;
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
      
      // Update state with new thought and node
      set((state) => ({
        thoughts: [...state.thoughts, thoughtData],
        thoughtNodes: [...state.thoughtNodes, thoughtNode],
        isLoading: false
      }));
      
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
      // Mark thought as removing for animation
      set((state) => ({
        removingThoughtIds: [...state.removingThoughtIds, thoughtId]
      }));
      
      // Delay removal to allow for animation
      setTimeout(async () => {
        // Call the backend API to remove the thought
        await thoughtApi.deleteThought(thoughtId);
        
        // Update state by removing the thought and node
        set((state) => ({
          thoughts: state.thoughts.filter(t => t.id !== thoughtId),
          thoughtNodes: state.thoughtNodes.filter(n => n.id !== thoughtId),
          removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
        }));
      }, 500); // 500ms for animation
    } catch (error) {
      console.error('Error removing thought:', error);
      // Remove from removing list even if API call fails
      set((state) => ({
        removingThoughtIds: state.removingThoughtIds.filter(id => id !== thoughtId)
      }));
    }
  },
  
  setMaxThoughtCount: async (count: number) => {
    try {
      // Call the backend API to set max thought count
      await thoughtApi.setMaxThoughtCount(count);
      
      // Update local state
      set({ maxThoughtCount: count });
    } catch (error) {
      console.error('Error setting max thought count:', error);
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