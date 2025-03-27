import { useCallback, useState, useEffect } from 'react';
import { 
  Node, 
  NodeChange,
  applyNodeChanges,
  XYPosition,
  useReactFlow
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
  const reactFlowInstance = useReactFlow();
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

  // Reposition active thoughts to the right of the response node
  const repositionActiveThoughts = useCallback((responseNodeId: string) => {
    try {
      const thoughtStore = useThoughtStore.getState();
      const activeThoughtIds = thoughtStore.activeThoughtIds;

      console.log('DEBUG: Active thoughts to reposition:', activeThoughtIds);
      
      if (activeThoughtIds.length === 0) {
        console.log('No active thoughts to reposition');  
        return; // No active thoughts to reposition
      }
      
      // Get the response node from ReactFlow
      const responseNode = reactFlowInstance.getNode(responseNodeId);
      if (!responseNode) {
        console.error('Response node not found for repositioning thoughts');
        return;
      }
      
      // Move the first active thought to the right by 50px
      // User updateThoughtNodePosition?
      const firstThoughtId = activeThoughtIds[0];
      const firstThoughtNode = reactFlowInstance.getNode(firstThoughtId);
      if (firstThoughtNode) {
        console.log('!!!DEBUG: Repositioning thought:', firstThoughtId);
        updateThoughtNodePosition(firstThoughtId, { x: firstThoughtNode.position.x + 50, y: firstThoughtNode.position.y });
      }
      
      // Clear active thoughts after a delay to ensure repositioning is complete
      // and visual updates have been applied
      setTimeout(() => {
        thoughtStore.clearActiveThoughts();
        console.log('Cleared active thoughts after repositioning');
      }, 1000);
    } catch (error) {
      console.error('Error repositioning active thoughts:', error);
    }
  }, [reactFlowInstance, updateThoughtNodePosition]);

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
      
      // Get the input node from ReactFlow instead of DOM
      const inputNode = reactFlowInstance.getNode(activeInputId);
      let position: XYPosition = { x: 0, y: 0 }; // Default position
      
      if (inputNode) {
        // Calculate position based on ReactFlow node properties
        const inputWidth = inputNode.width || 500; // Default width if not available
        const inputHeight = inputNode.height || 200; // Default height if not available
        
        // Position the response node 
        position = {
          x: inputNode.position.x,
          y: inputNode.position.y + inputHeight + 50
        }
      }
      
      // Create the response node
      const nodeId = addResponseNode(content, position);
      
      // Reposition active thoughts to the right of the new response node
      if (nodeId) {
        setTimeout(() => repositionActiveThoughts(nodeId), 100);
      }
      
      // Refit the view to include the new node
      setTimeout(() => {
        // Get all nodes from ReactFlow
        const allNodes = reactFlowInstance.getNodes();
        // Filter to only include input and response nodes
        const nodesToFit = allNodes.filter(node => 
          node.type === 'textInput' || node.type === 'response'
        );
        
        reactFlowInstance.fitView({
          padding: 0.5,
          includeHiddenNodes: false,
          duration: 800, // Smooth animation duration in ms
          nodes: nodesToFit // Only fit view to input and response nodes
        });
      }, 300); // Small delay to ensure node is rendered
      
      return nodeId;
    } catch (error) {
      console.error('Error creating response node:', error);
      return null;
    }
  }, [addResponseNode, reactFlowInstance, repositionActiveThoughts]);

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