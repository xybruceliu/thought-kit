// Node Connectors
// Core functions that connect data stores with node visualization

import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { Thought } from '../types/thought';
import nodeStore, { useNodeStore, ThoughtBubbleNodeData, NodeData } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a node in the NodeStore to represent a thought from the ThoughtStore
 * @param thought The thought data from ThoughtStore
 * @param position The position for the node on the canvas
 * @returns The created ReactFlow node
 */
export function createThoughtNode(thought: Thought, position: XYPosition): ReactFlowNode<NodeData> {
  console.log('DEBUG: Creating thought node:', thought, position);
  // Get the node store instance
  const nodeStore = useNodeStore.getState();
  const thoughtStore = useThoughtStore.getState();

  // Add the thought to the thought store
  thoughtStore.addThought(thought); 
  // Add the thought to the active thoughts list
  thoughtStore.addActiveThought(thought.id);  
  
  // Generate a random blob variant (0-4)
  const blobVariant = Math.floor(Math.random() * 5);
  
  // Add the thought node
  return nodeStore.addNode(position, {
    thoughtId: thought.id,
    blobVariant
  });
}

/**
 * Generates a thought and creates a node for it in one operation
 * @param triggerType The event type that triggered the thought generation
 * @param position The position for the node on the canvas
 * @returns Promise resolving to the created node or null if thought generation failed
 */
export async function generateAndCreateThoughtNode(
  triggerType: 'SENTENCE_END' | 'WORD_COUNT_CHANGE' | 'IDLE_TIME' | 'CLICK',
  position: XYPosition
): Promise<ReactFlowNode<NodeData> | null> {
  try {
    // Generate the thought
    const thought = await useThoughtStore.getState().generateThought(triggerType);
    
    // Create a thought node if successful
    if (thought) {
      return createThoughtNode(thought, position);
    }
    
    return null;
  } catch (error) {
    console.error('Error generating and creating thought node:', error);
    return null;
  }
}

/**
 * Checks if a node exists for a specific thought
 * @param thoughtId The ID of the thought to check
 * @returns True if a node exists for the thought, false otherwise
 */
export function doesNodeExistForThought(thoughtId: string): boolean {
  return !!getNodeByThoughtId(thoughtId);
}

/**
 * Gets a node by its associated thought ID
 * @param thoughtId The ID of the thought
 * @returns The node associated with the thought, or undefined if not found
 */
export function getNodeByThoughtId(thoughtId: string): ReactFlowNode<NodeData> | undefined {
  return useNodeStore.getState().nodes.find(node => 
    node.data.thoughtId === thoughtId
  );
}

/**
 * Gets a node by its ID
 * @param nodeId The ID of the node
 * @returns The node associated with the ID, or undefined if not found
 */
export function getNodeById(nodeId: string): ReactFlowNode<NodeData> | undefined {
  return useNodeStore.getState().getNodeById(nodeId);
}


// -------------------- DELETE METHODS --------------------

/**
 * Removes a thought node and handles cleanup in both stores
 * @param thoughtId The ID of the thought to remove
 */
export function deleteThoughtNode(thoughtId: string): void {
  // Get the node store instance
  const nodeStore = useNodeStore.getState();
  const thoughtStore = useThoughtStore.getState();

  // Find the node in the NodeStore
  const node = getNodeByThoughtId(thoughtId);
  if (node) {
    // Remove from NodeStore
    nodeStore.removeNode(node.id);
    // Remove from ThoughtStore
    thoughtStore.removeThought(thoughtId)
  }
}

// -------------------- UPDATE METHODS --------------------

/**
 * Updates properties of an existing thought node
 * @param thoughtId The ID of the thought to update
 * @param properties New properties to apply to the node
 */
export function updateThoughtNode(thoughtId: string, properties: Partial<Omit<ThoughtBubbleNodeData, 'type' | 'thoughtId'>>): void {
  const nodeStore = useNodeStore.getState();
  const node = getNodeByThoughtId(thoughtId);
  if (node) {
    // Ensure we're not changing the node type or ID
    const updatedProperties: Partial<ThoughtBubbleNodeData> = {
      ...properties,
      type: 'thoughtBubble',
      thoughtId
    };
    
    nodeStore.updateNodeData(node.id, updatedProperties);
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
    // Update the node's position in NodeStore
    const updatedNodes = nodeStore.nodes.map(n => 
      n.id === nodeId ? { ...n, position } : n
    );
    nodeStore.setNodes(updatedNodes);
  }
}

/**
 * Repositions a node by its associated thought ID
 * @param thoughtId The ID of the thought
 * @param position The new position
 */
export function repositionNodeByThoughtId(thoughtId: string, position: XYPosition): void {
  const node = getNodeByThoughtId(thoughtId);
  if (node) {
    repositionNode(node.id, position);
  }
}

/**
 * Marks a node as being removed, allowing for animations
 * @param nodeId The ID of the node to mark for removal
 */
export function markNodeForRemoval(nodeId: string): void {
  const nodeStore = useNodeStore.getState();
  nodeStore.markNodeAsRemoving(nodeId);
} 