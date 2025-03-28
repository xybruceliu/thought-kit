// Node-Thought Synchronization
// Coordinates position updates between ThoughtStore and NodeStore

import { useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useNodeStore } from '../store/nodeStore';
import { XYPosition } from 'reactflow';

/**
 * Hook to synchronize ThoughtStore position data with NodeStore position data.
 * This ensures that when nodes are moved in the ReactFlow canvas, their positions
 * are properly updated in the ThoughtStore and vice versa.
 */
export function useNodeThoughtSync() {
  const thoughts = useThoughtStore(state => state.thoughts);
  const setNodePosition = useThoughtStore(state => state.setNodePosition);
  const getNodePosition = useThoughtStore(state => state.getNodePosition);
  
  const nodes = useNodeStore(state => state.nodes);
  const setNodes = useNodeStore(state => state.setNodes);
  const getNodeByEntityId = useNodeStore(state => state.getNodeByEntityId);
  
  // When nodes are moved in the ReactFlow canvas, update position in ThoughtStore
  useEffect(() => {
    // Only process thought bubble nodes
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
  }, [nodes, setNodePosition, getNodePosition]);
  
  // When thought positions are updated in ThoughtStore, update ReactFlow nodes
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
    
    // Only update if there were actual changes
    if (hasUpdates) {
      setNodes(updatedNodes);
    }
  }, [thoughts, getNodePosition, getNodeByEntityId, nodes, setNodes]);
  
  return null; // This hook doesn't return anything, it just performs side effects
}

/**
 * Utility function to ensure a node exists for each thought
 * This is useful when loading a saved state or when thoughts are generated
 * in ways other than through the UI
 */
export function ensureNodesForThoughts() {
  const thoughts = useThoughtStore.getState().thoughts;
  const getNodeByEntityId = useNodeStore.getState().getNodeByEntityId;
  const addNode = useNodeStore.getState().addNode;
  
  thoughts.forEach(thought => {
    // Check if a node already exists for this thought
    const existingNode = getNodeByEntityId('thought', thought.id);
    if (!existingNode) {
      // Get position from thought store or use a default
      const position = useThoughtStore.getState().getNodePosition(thought.id) || 
        { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 };
      
      // Create a node for this thought
      addNode('thoughtBubble', position, {
        thoughtId: thought.id,
        blobVariant: Math.floor(Math.random() * 5)
      });
    }
  });
}

/**
 * Utility function to update a node's position when the thought position changes
 */
export function updateNodePosition(thoughtId: string, position: XYPosition) {
  const node = useNodeStore.getState().getNodeByEntityId('thought', thoughtId);
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
  }
} 