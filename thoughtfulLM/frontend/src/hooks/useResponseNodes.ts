import { useCallback, useState, useEffect } from 'react';
import { 
  Node, 
  NodeChange,
  applyNodeChanges,
  XYPosition
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { createBoundsRightOfNode, calculateNodePosition, boundedAreaStrategy } from '../utils/nodePositioning';
import { useBoundsStore } from '../store/boundsStore';
import { useThoughtNodes } from './useThoughtNodes';
import { ThoughtNode } from './useThoughtNodes';

// Define the type for a response node
export interface ResponseNode extends Node {
  type: 'response';
  data: {
    content: string;
  };
}

// Custom hook for managing response nodes in ReactFlow
export const useResponseNodes = () => {
  // State for response nodes
  const [responseNodes, setResponseNodes] = useState<ResponseNode[]>([]);
  const { updateThoughtNodePosition } = useThoughtNodes();
  
  // Handle changes to response nodes
  const onResponseNodesChange = useCallback((changes: NodeChange[]) => {
    setResponseNodes((nds) => applyNodeChanges(changes, nds) as ResponseNode[]);
  }, []);

  // Add a new response node
  const addResponseNode = useCallback((content: string, position: XYPosition) => {
    const id = uuidv4();
    const newNode: ResponseNode = {
      id,
      type: 'response',
      position,
      draggable: false,
      data: {
        content
      }
    };

    setResponseNodes((nds) => [...nds, newNode]);
    return id;
  }, []);

  // Reposition active thoughts after a response is created
  const repositionActiveThoughts = useCallback((responseNodeId: string, responseNodePosition: XYPosition) => {
    try {
      const thoughtStore = useThoughtStore.getState();
      const activeThoughtIds = thoughtStore.activeThoughtIds;
      
      if (activeThoughtIds.length === 0) {
        return; // No active thoughts to reposition
      }
      
      // Move the first active thought to the right of the response node
      const firstThoughtId = activeThoughtIds[0];
      
      if (firstThoughtId) {
        // Position to the right of the response node
        updateThoughtNodePosition(firstThoughtId, { 
          x: responseNodePosition.x + 400, 
          y: responseNodePosition.y 
        });
      }
      
      // Clear active thoughts after a delay to ensure repositioning is complete
      setTimeout(() => {
        thoughtStore.clearActiveThoughts();
      }, 1000);
    } catch (error) {
      console.error('Error repositioning active thoughts:', error);
    }
  }, [updateThoughtNodePosition]);

  // Create a response node from content and calculate position
  const createResponseNode = useCallback((content: string) => {
    try {
      // Clear all existing response nodes
      // TODO: Temporary, may change later
      setResponseNodes([]);
      
      // Get the active input node ID
      const activeInputId = useInputStore.getState().activeInputId;
      if (!activeInputId) {
        console.error('No active input node found');
        return null;
      }
      
      // Use a default position - this is a simplification since we can't
      // directly access the input node's position from the store
      const position: XYPosition = { x: 50, y: 300 };
      
      // Create the response node
      const nodeId = addResponseNode(content, position);
      
      // Reposition active thoughts based on the response node position
      if (nodeId) {
        setTimeout(() => repositionActiveThoughts(nodeId, position), 100);
      }
      
      return nodeId;
    } catch (error) {
      console.error('Error creating response node:', error);
      return null;
    }
  }, [addResponseNode, repositionActiveThoughts]);

  // Register callback with thought store
  useEffect(() => {
    // Set up callback for when articulation is complete
    const thoughtStore = useThoughtStore.getState();
    
    thoughtStore.onResponseCreated = (content) => {
      if (content) {
        // Create a node with the response content
        return createResponseNode(content) || '';
      }
      return '';
    };
    
    // Clean up when component unmounts
    return () => {
      const thoughtStore = useThoughtStore.getState();
      thoughtStore.onResponseCreated = undefined;
    };
  }, [createResponseNode]);

  // Update the content of a response node
  const updateResponseContent = useCallback((nodeId: string, content: string) => {
    setResponseNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              content
            }
          };
        }
        return node;
      })
    );
  }, []);

  // Get a response node by ID
  const getResponseNode = useCallback((nodeId: string) => {
    return responseNodes.find(node => node.id === nodeId);
  }, [responseNodes]);

  return {
    responseNodes,
    onResponseNodesChange,
    addResponseNode,
    createResponseNode,
    updateResponseContent,
    getResponseNode,
    repositionActiveThoughts
  };
};

export default useResponseNodes; 