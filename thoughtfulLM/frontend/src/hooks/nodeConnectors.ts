// Node Connectors
// Core functions that connect data stores with node visualization

import { XYPosition, Node } from 'reactflow';
import { Thought } from '../types/thought';
import { useNodeStore, NodeType, ThoughtBubbleNodeData, TextInputNodeData, ResponseNodeData, NodeData } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { v4 as uuidv4 } from 'uuid';
import { updateNodePosition as syncNodePosition } from './nodeStoreSync';

/**
 * Creates a node in the NodeStore to represent a thought from the ThoughtStore
 * @param thought The thought data from ThoughtStore
 * @param position The position for the node on the canvas
 * @returns The created ReactFlow node
 */
export function createThoughtNode(thought: Thought, position: XYPosition): Node {
  // Get the node store instance
  const nodeStore = useNodeStore.getState();
  
  // Generate a random blob variant (0-4)
  const blobVariant = Math.floor(Math.random() * 5);
  
  // Add the thought node
  return nodeStore.addNode('thoughtBubble', position, {
    thoughtId: thought.id,
    blobVariant
  });
}

/**
 * Creates a node in the NodeStore to represent a text input field
 * @param position The position for the node on the canvas
 * @param onChange Optional callback for text changes
 * @param existingInputId Optional existing inputId to use (for synchronization)
 * @returns The created ReactFlow node
 */
export function createInputNode(position: XYPosition, onChange?: (value: string) => void, existingInputId?: string): Node {
  // Get the stores
  const nodeStore = useNodeStore.getState();
  const inputStore = useInputStore.getState();
  
  // Use provided inputId or generate a new one
  const inputId = existingInputId || uuidv4();
  
  // Register the input with the input store if it doesn't exist already
  if (!inputStore.inputs[inputId]) {
    inputStore.addInputNode(inputId, position);
  } else if (position) {
    // Update position if it's provided and the input already exists
    inputStore.setNodePosition(inputId, position);
  }
  
  // Add the input node
  return nodeStore.addNode('textInput', position, {
    inputId,
    onChange
  });
}

/**
 * Creates a node in the NodeStore to represent a response
 * @param responseText The text content for the response
 * @param position The position for the node on the canvas
 * @param existingResponseId Optional existing responseId to use (for synchronization)
 * @returns The created ReactFlow node
 */
export function createResponseNode(responseText: string, position: XYPosition, existingResponseId?: string): Node {
  // Get the node store instance
  const nodeStore = useNodeStore.getState();
  
  // Use provided responseId or generate a new one
  const responseId = existingResponseId || `response-${Date.now()}`;
  
  // Add the response node
  return nodeStore.addNode('response', position, {
    responseId,
    responseText
  });
}

/**
 * Checks if a node exists for a specific entity (thought, input, or response)
 * @param entityType The type of entity to check
 * @param entityId The ID of the entity
 * @returns True if a node exists for the entity, false otherwise
 */
export function doesNodeExistByEntityId(entityType: 'thought' | 'input' | 'response', entityId: string): boolean {
  return !!useNodeStore.getState().getNodeByEntityId(entityType, entityId);
}

/**
 * Gets a node by its associated entity ID
 * @param entityType The type of entity to look for
 * @param entityId The ID of the entity
 * @returns The node associated with the entity, or undefined if not found
 */
export function getNodeByEntityId(entityType: 'thought' | 'input' | 'response', entityId: string): Node | undefined {
  return useNodeStore.getState().getNodeByEntityId(entityType, entityId);
}

// -------------------- DELETE METHODS --------------------

/**
 * Removes a thought node and handles cleanup in both stores
 * @param thoughtId The ID of the thought to remove
 */
export function deleteThoughtNode(thoughtId: string): void {
  // Find the node in the NodeStore
  const node = getNodeByEntityId('thought', thoughtId);
  if (node) {
    // Remove from NodeStore
    useNodeStore.getState().removeNode(node.id);
    
    // Remove from ThoughtStore
    // Note: This depends on your application's needs - whether deleting the visualization
    // should also delete the underlying data
    useThoughtStore.getState().handleThoughtDelete(thoughtId);
  }
}

/**
 * Removes an input node and handles cleanup in both stores
 * @param inputId The ID of the input to remove
 */
export function deleteInputNode(inputId: string): void {
  // Find the node in the NodeStore
  const node = getNodeByEntityId('input', inputId);
  if (node) {
    // Remove from NodeStore
    useNodeStore.getState().removeNode(node.id);
    
    // Remove from InputStore
    useInputStore.getState().removeInputNode(inputId);
  }
}

/**
 * Removes a response node from the NodeStore
 * @param responseId The ID of the response to remove
 */
export function deleteResponseNode(responseId: string): void {
  // Find the node in the NodeStore
  const node = getNodeByEntityId('response', responseId);
  if (node) {
    // Remove from NodeStore
    useNodeStore.getState().removeNode(node.id);
    
    // Note: If you have a dedicated response store, you would remove it from there too
  }
}

// -------------------- UPDATE METHODS --------------------

/**
 * Updates properties of an existing thought node
 * @param thoughtId The ID of the thought to update
 * @param properties New properties to apply to the node
 */
export function updateThoughtNode(thoughtId: string, properties: Partial<Omit<ThoughtBubbleNodeData, 'type' | 'thoughtId'>>): void {
  const node = getNodeByEntityId('thought', thoughtId);
  if (node) {
    // Ensure we're not changing the node type or ID
    const updatedProperties: Partial<ThoughtBubbleNodeData> = {
      ...properties,
      type: 'thoughtBubble',
      thoughtId
    };
    
    useNodeStore.getState().updateNodeData(node.id, updatedProperties);
  }
}

/**
 * Updates properties of an existing input node
 * @param inputId The ID of the input to update
 * @param properties New properties to apply to the node
 */
export function updateInputNode(inputId: string, properties: Partial<Omit<TextInputNodeData, 'type' | 'inputId'>>): void {
  const node = getNodeByEntityId('input', inputId);
  if (node) {
    // Ensure we're not changing the node type or ID
    const updatedProperties: Partial<TextInputNodeData> = {
      ...properties,
      type: 'textInput',
      inputId
    };
    
    useNodeStore.getState().updateNodeData(node.id, updatedProperties);
  }
}

/**
 * Updates properties of an existing response node
 * @param responseId The ID of the response to update
 * @param properties New properties to apply to the node
 */
export function updateResponseNode(responseId: string, properties: Partial<Omit<ResponseNodeData, 'type' | 'responseId'>>): void {
  const node = getNodeByEntityId('response', responseId);
  if (node) {
    // Ensure we're not changing the node type or ID
    const updatedProperties: Partial<ResponseNodeData> = {
      ...properties,
      type: 'response',
      responseId
    };
    
    useNodeStore.getState().updateNodeData(node.id, updatedProperties);
  }
}

// -------------------- POSITION METHODS --------------------

/**
 * Updates a node's position with animation
 * @param nodeId The ID of the node to reposition
 * @param position The new position
 */
export function repositionNode(nodeId: string, position: XYPosition): void {
  const nodeStore = useNodeStore.getState();
  const node = nodeStore.getNodeById(nodeId);
  
  if (node) {
    // Update the ReactFlow node position
    const updatedNodes = nodeStore.nodes.map(n => 
      n.id === nodeId ? { ...n, position } : n
    );
    nodeStore.setNodes(updatedNodes);
    
    // Sync position to appropriate data store based on node type
    if (node.type === 'thoughtBubble' && node.data.type === 'thoughtBubble') {
      syncNodePosition('thought', node.data.thoughtId, position);
    }
    else if (node.type === 'textInput' && node.data.type === 'textInput') {
      syncNodePosition('input', node.data.inputId, position);
    }
    else if (node.type === 'response' && node.data.type === 'response') {
      syncNodePosition('response', node.data.responseId, position);
    }
  }
}

// -------------------- STATE TRANSITION METHODS --------------------

/**
 * Marks a node as being in the process of removal (for animations)
 * @param nodeId The ID of the node to mark
 */
export function markNodeForRemoval(nodeId: string): void {
  useNodeStore.getState().markNodeAsRemoving(nodeId);
} 