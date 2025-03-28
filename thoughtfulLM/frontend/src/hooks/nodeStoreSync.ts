// Unified Node Store Synchronization
// Coordinates bidirectional updates between data stores and NodeStore for all node types

import { useEffect } from 'react';
import { XYPosition } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { useNodeStore, NodeType } from '../store/nodeStore';
import { createThoughtNode, createInputNode } from './nodeConnectors';

/**
 * Hook to synchronize all data stores with NodeStore.
 * This ensures bidirectional updates for positions, additions, and removals
 * for all node types (thoughts, inputs, responses).
 */
export function useNodeStoreSync() {
  // Thought Store selectors
  const thoughts = useThoughtStore(state => state.thoughts);
  const setNodePosition = useThoughtStore(state => state.setNodePosition);
  const getNodePosition = useThoughtStore(state => state.getNodePosition);
  
  // Input Store selectors
  const inputs = useInputStore(state => state.inputs);
  const activeInputId = useInputStore(state => state.activeInputId);
  const setInputPosition = useInputStore(state => state.setNodePosition);
  const getInputPosition = useInputStore(state => state.getNodePosition);
  
  // Node Store selectors
  const nodes = useNodeStore(state => state.nodes);
  const setNodes = useNodeStore(state => state.setNodes);
  const getNodeByEntityId = useNodeStore(state => state.getNodeByEntityId);
  const removeNode = useNodeStore(state => state.removeNode);
  
  // 1. When nodes are moved in the ReactFlow canvas, update position in data stores
  useEffect(() => {
    // 1a. Sync thought bubble nodes to ThoughtStore
    const thoughtNodes = nodes.filter(node => node.type === 'thoughtBubble');
    
    thoughtNodes.forEach(node => {
      if (node.data.type === 'thoughtBubble') {
        const { thoughtId } = node.data;
        const currentPosition = getNodePosition(thoughtId);
        
        // Only update if position changed
        if (!currentPosition || 
            currentPosition.x !== node.position.x || 
            currentPosition.y !== node.position.y) {
          setNodePosition(thoughtId, node.position);
        }
      }
    });
    
    // 1b. Sync input nodes to InputStore
    const inputNodes = nodes.filter(node => node.type === 'textInput');
    
    inputNodes.forEach(node => {
      if (node.data.type === 'textInput') {
        const { inputId } = node.data;
        const currentPosition = getInputPosition(inputId);
        
        // Only update if position changed
        if (!currentPosition || 
            currentPosition.x !== node.position.x || 
            currentPosition.y !== node.position.y) {
          setInputPosition(inputId, node.position);
        }
      }
    });
    
    // 1c. Response node position syncing could be added here if needed
    
  }, [nodes, setNodePosition, getNodePosition, setInputPosition, getInputPosition]);
  
  // 2. When thought positions are updated in ThoughtStore, update NodeStore
  useEffect(() => {
    let hasUpdates = false;
    const updatedNodes = [...nodes];
    
    thoughts.forEach(thought => {
      const position = getNodePosition(thought.id);
      if (position) {
        const node = getNodeByEntityId('thought', thought.id);
        if (node && (
            node.position.x !== position.x || 
            node.position.y !== position.y
        )) {
          // Find the node in our copied array and update its position
          const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
          if (nodeIndex >= 0) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: position
            };
            hasUpdates = true;
          }
        }
      }
    });
    
    // 2b. When input positions are updated in InputStore, update NodeStore
    Object.entries(inputs).forEach(([inputId, inputData]) => {
      const position = inputData.position;
      if (position) {
        const node = getNodeByEntityId('input', inputId);
        if (node && (
            node.position.x !== position.x || 
            node.position.y !== position.y
        )) {
          // Find the node in our copied array and update its position
          const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
          if (nodeIndex >= 0) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: position
            };
            hasUpdates = true;
          }
        }
      }
    });
    
    // Only update if there were actual changes
    if (hasUpdates) {
      setNodes(updatedNodes);
    }
  }, [thoughts, inputs, getNodePosition, getNodeByEntityId, nodes, setNodes]);
  
  // 3. Ensure nodes exist for all entities in data stores
  useEffect(() => {
    ensureNodesForAllEntities();
  }, [thoughts, inputs]);
  
  // 4. Clean up nodes when entities are removed from data stores
  useEffect(() => {
    // Check for nodes that reference thoughts that no longer exist
    const thoughtIds = new Set(thoughts.map(t => t.id));
    const inputIds = new Set(Object.keys(inputs));
    
    // Find orphaned thought nodes
    nodes.forEach(node => {
      if (node.data.type === 'thoughtBubble') {
        const { thoughtId } = node.data;
        if (!thoughtIds.has(thoughtId)) {
          // Remove orphaned node
          removeNode(node.id);
        }
      }
      else if (node.data.type === 'textInput') {
        const { inputId } = node.data;
        if (!inputIds.has(inputId)) {
          // Remove orphaned node
          removeNode(node.id);
        }
      }
      // Response nodes don't have a dedicated store to check against
    });
  }, [thoughts, inputs, nodes, removeNode]);
  
  return null; // This hook doesn't return anything, it just performs side effects
}

/**
 * Utility function to ensure nodes exist for all entities in all data stores
 */
export function ensureNodesForAllEntities() {
  // 1. Ensure thought nodes
  ensureNodesForThoughts();
  
  // 2. Ensure input nodes 
  ensureNodesForInputs();
  
  // 3. Response nodes are typically created on demand and don't have a separate store
}

/**
 * Utility function to ensure nodes exist for all thoughts
 */
export function ensureNodesForThoughts() {
  const thoughts = useThoughtStore.getState().thoughts;
  const getNodeByEntityId = useNodeStore.getState().getNodeByEntityId;
  
  thoughts.forEach(thought => {
    // Check if a node already exists for this thought
    const existingNode = getNodeByEntityId('thought', thought.id);
    if (!existingNode) {
      // Get position from thought store or use a default
      const position = useThoughtStore.getState().getNodePosition(thought.id) || 
        { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 };
      
      // Create a node for this thought
      createThoughtNode(thought, position);
    }
  });
}

/**
 * Utility function to ensure nodes exist for all inputs
 */
export function ensureNodesForInputs() {
  const inputs = useInputStore.getState().inputs;
  const getNodeByEntityId = useNodeStore.getState().getNodeByEntityId;
  
  Object.entries(inputs).forEach(([inputId, inputData]) => {
    // Check if a node already exists for this input
    const existingNode = getNodeByEntityId('input', inputId);
    if (!existingNode) {
      // Use position from input store or use a default
      const position = inputData.position || { x: 250, y: 250 };
      
      // Create a node for this input, using the existing inputId
      createInputNode(position, undefined, inputId);
    }
  });
}

/**
 * Utility function to update a node's position
 */
export function updateNodePosition(entityType: 'thought' | 'input' | 'response', entityId: string, position: XYPosition) {
  const node = useNodeStore.getState().getNodeByEntityId(entityType, entityId);
  if (node) {
    // Get all nodes and update the position for this specific node
    const nodes = useNodeStore.getState().nodes;
    const updatedNodes = nodes.map(n => {
      if (n.id === node.id) {
        return {
          ...n,
          position
        };
      }
      return n;
    });
    
    // Update all nodes at once
    useNodeStore.getState().setNodes(updatedNodes);
    
    // If it's a thought, also update the position in ThoughtStore
    if (entityType === 'thought') {
      useThoughtStore.getState().setNodePosition(entityId, position);
    }
    // If it's an input, also update the position in InputStore
    else if (entityType === 'input') {
      useInputStore.getState().setNodePosition(entityId, position);
    }
  }
} 