// Unified Node Store for managing all node types
// This solves synchronization issues between ReactFlow state and Zustand state

import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  applyNodeChanges, 
  applyEdgeChanges,
  XYPosition
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

// Import existing store types
import { Thought } from '../types/thought';

// Node types - since we only have one type now
export type NodeType = 'thoughtBubble';

// Thought bubble node data
export interface ThoughtBubbleNodeData {
  type: NodeType;
  thoughtId: string; // The ID of the thought this node represents
  blobVariant?: number;
  // Add other thought-specific properties here
}

// We only have ThoughtBubbleNodeData now
export type NodeData = ThoughtBubbleNodeData;

// Interface for node creation parameters
export interface NodeCreationParams {
  thoughtId?: string;
  blobVariant?: number;
  [key: string]: any;
}

// Interface for the node store
interface NodeStoreState {
  // Basic ReactFlow state
  nodes: Node<NodeData>[];
  edges: Edge[];
  
  // Node operations
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  
  // Specialized node operations
  addNode: (position: XYPosition, data: NodeCreationParams, options?: { draggable?: boolean }) => Node<NodeData>;
  updateNodeData: (nodeId: string, newData: Partial<NodeData>) => void;
  getNodeById: (nodeId: string) => Node<NodeData> | undefined;
  getNodeByThoughtId: (thoughtId: string) => Node<NodeData> | undefined;
  removeNode: (nodeId: string) => void;
  
  // Batch operations
  clearAllNodes: () => void;
  
  // Track nodes being removed (for animations)
  removingNodeIds: string[];
  markNodeAsRemoving: (nodeId: string) => void;
}

export const useNodeStore = create<NodeStoreState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  removingNodeIds: [],
  
  // Basic setters
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  // ReactFlow change handlers
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node<NodeData>[],
    }));
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  
  // Add a new node - simplified to only handle thought nodes
  addNode: (position, data, options = {}) => {
    const nodeData: ThoughtBubbleNodeData = {
      type: 'thoughtBubble',
      thoughtId: data.thoughtId || uuidv4(),
      blobVariant: data.blobVariant,
      ...data
    };
    
    const newNode: Node<NodeData> = {
      id: uuidv4(),
      type: 'thoughtBubble',
      position,
      data: nodeData,
      draggable: true,
      ...options
    };
    
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    
    return newNode;
  },
  
  // Update node data
  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          // Make sure we're maintaining the node type
          const updatedData = {
            ...node.data,
            ...newData,
            type: node.data.type, // Ensure type doesn't change
          };
          
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      }),
    }));
  },
  
  // Get node by ID
  getNodeById: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },
  
  // Get node by thought ID - simplified from getNodeByEntityId
  getNodeByThoughtId: (thoughtId) => {
    return get().nodes.find(
      (node) => node.data.thoughtId === thoughtId
    );
  },
  
  // Remove a node
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      removingNodeIds: state.removingNodeIds.filter((id) => id !== nodeId),
    }));
  },
  
  // Clear all nodes
  clearAllNodes: () => {
    set({ nodes: [], edges: [], removingNodeIds: [] });
  },
  
  // Track nodes being removed (for animations)
  markNodeAsRemoving: (nodeId) => {
    set((state) => ({
      removingNodeIds: [...state.removingNodeIds, nodeId],
    }));
  },
  
}));

export default useNodeStore; 