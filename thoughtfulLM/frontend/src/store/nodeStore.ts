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

// Node types
export type NodeType = 'thoughtBubble' | 'textInput' | 'response';

// Node data base type with discriminator
interface BaseNodeData {
  type: NodeType;
}

// Thought bubble node data
export interface ThoughtBubbleNodeData extends BaseNodeData {
  type: 'thoughtBubble';
  thoughtId: string; // The ID of the thought this node represents
  blobVariant?: number;
  // Add other thought-specific properties here
}

// Text input node data
export interface TextInputNodeData extends BaseNodeData {
  type: 'textInput';
  inputId: string;
  onChange?: (value: string) => void;
  // Add other input-specific properties here
}

// Response node data
export interface ResponseNodeData extends BaseNodeData {
  type: 'response';
  responseId: string;
  responseText?: string;
  // Add other response-specific properties here
}

// Union type for all node data
export type NodeData = ThoughtBubbleNodeData | TextInputNodeData | ResponseNodeData;

// Interface for node creation parameters
export interface NodeCreationParams {
  thoughtId?: string;
  inputId?: string;
  responseId?: string;
  responseText?: string;
  blobVariant?: number;
  onChange?: (value: string) => void;
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
  addNode: (type: NodeType, position: XYPosition, data: NodeCreationParams) => Node<NodeData>;
  updateNodeData: (nodeId: string, newData: Partial<NodeData>) => void;
  getNodeById: (nodeId: string) => Node<NodeData> | undefined;
  getNodeByEntityId: (entityType: 'thought' | 'input' | 'response', entityId: string) => Node<NodeData> | undefined;
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
  
  // Add a new node
  addNode: (type, position, data) => {
    let nodeData: NodeData;
    
    // Create the correct node data type based on the node type
    switch (type) {
      case 'thoughtBubble':
        nodeData = {
          type: 'thoughtBubble',
          thoughtId: data.thoughtId || uuidv4(),
          blobVariant: data.blobVariant,
          ...data
        } as ThoughtBubbleNodeData;
        break;
      case 'textInput':
        nodeData = {
          type: 'textInput',
          inputId: data.inputId || uuidv4(),
          onChange: data.onChange,
          ...data
        } as TextInputNodeData;
        break;
      case 'response':
        nodeData = {
          type: 'response',
          responseId: data.responseId || uuidv4(),
          responseText: data.responseText,
          ...data
        } as ResponseNodeData;
        break;
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
    
    const newNode: Node<NodeData> = {
      id: uuidv4(),
      type,
      position,
      data: nodeData,
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
          } as NodeData;
          
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
  
  // Get node by entity ID (thought, input, or response ID)
  getNodeByEntityId: (entityType, entityId) => {
    let nodeType: NodeType;
    let idProperty: string;
    
    switch (entityType) {
      case 'thought':
        nodeType = 'thoughtBubble';
        idProperty = 'thoughtId';
        break;
      case 'input':
        nodeType = 'textInput';
        idProperty = 'inputId';
        break;
      case 'response':
        nodeType = 'response';
        idProperty = 'responseId';
        break;
      default:
        return undefined;
    }
    
    return get().nodes.find(
      (node) => node.data.type === nodeType && (node.data as any)[idProperty] === entityId
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