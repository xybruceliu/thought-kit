import { useState, useCallback, useEffect } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';

/**
 * Custom hook that manages ReactFlow nodes in sync with the Thought store
 * Provides methods for managing nodes and handles synchronization with canvas interactions
 */
export const useThoughtNodes = () => {
  const { thoughtNodes, updateThoughtNodePosition, fetchAllThoughts } = useThoughtStore();
  const { fetchMemories } = useMemoryStore();
  
  // Initialize with text input node and thought nodes from store
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'input-1',
      type: 'textInput',
      position: { x: 0, y: 0 },
      data: { 
        value: '', 
        onChange: (value: string) => {
          console.log('Input changed:', value);
        } 
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
      // Add all thought nodes from the store
      ...thoughtNodes
    ]);
  }, [thoughtNodes]);

  // Initialize the store with the data from the backend  
  useEffect(() => {
    // Fetch thoughts
    fetchAllThoughts().catch(error => {
      console.error('Error fetching thoughts:', error);
    });
    
    // Fetch memories
    fetchMemories().catch(error => {
      console.error('Error fetching memories:', error);
    });
  }, [fetchAllThoughts, fetchMemories]);

  return {
    nodes,
    onNodesChange
  };
}; 