import { useState, useCallback, useEffect } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';

/**
 * Custom hook that manages ReactFlow nodes in sync with the Thought store
 * Provides methods for managing nodes and handles synchronization with canvas interactions
 */
export const useThoughtNodes = () => {
  const { 
    thoughtNodes, 
    updateThoughtNodePosition,
    removingThoughtIds  // Get the removingThoughtIds from the store
  } = useThoughtStore();
  
  // Initialize with text input node and thought nodes from store
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'input-1',
      type: 'textInput',
      position: { x: 0, y: 0 },
      data: { 
        value: '', 
      },
      draggable: false, // Prevent dragging the text input node
    },
    ...thoughtNodes
  ]);
  
  // Handle node changes including position updates
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local ReactFlow state
      setNodes((nds) => applyNodeChanges(changes, nds));
      
      // Update store for position changes
      changes.forEach(change => {
        if (change.type === 'position' && change.id !== 'input-1') {
          const nodeData = nodes.find(n => n.id === change.id);
          if (nodeData && change.position) {
            updateThoughtNodePosition(change.id, change.position);
          }
        }
      });
    },
    [nodes, updateThoughtNodePosition]
  );

  // Keep nodes in sync with thoughtNodes in the store
  useEffect(() => {
    setNodes([
      // Keep the input node
      nodes.find(node => node.id === 'input-1') as Node,
      // Add all thought nodes from the store with isRemoving flag
      ...thoughtNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isRemoving: removingThoughtIds.includes(node.id)
        }
      }))
    ]);
  }, [thoughtNodes, removingThoughtIds]); // Add removingThoughtIds as a dependency

  // With frontend-only storage, we don't need to initialize from backend
  // The stores are initialized with empty arrays already

  return {
    nodes,
    onNodesChange
  };
}; 