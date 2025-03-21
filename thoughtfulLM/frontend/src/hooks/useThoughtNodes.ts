import { useState, useCallback, useEffect } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition, useReactFlow } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';

/**
 * Custom hook that manages ReactFlow nodes in sync with the Thought store
 * Provides methods for managing nodes and handles synchronization with canvas interactions
 */
export const useThoughtNodes = () => {
  const reactFlowInstance = useReactFlow();
  const { thoughtNodes, updateThoughtNodePosition, generateThoughtAtPosition } = useThoughtStore();
  
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

  // Handle clicks on the pane to generate thoughts
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Get position in the flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Apply offset to position bubbles to the top left of cursor
      const offsetX = 80;  // pixels to the left
      const offsetY = 50;  // pixels to the top
      
      // Generate a thought at the clicked position with offsets
      generateThoughtAtPosition('CLICK', {
        x: position.x - offsetX,
        y: position.y - offsetY
      });
    },
    [reactFlowInstance, generateThoughtAtPosition]
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

  return {
    nodes,
    onNodesChange,
    onPaneClick
  };
}; 