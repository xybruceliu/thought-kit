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
import { createBoundsRightOfNode, boundedAreaStrategy } from '../utils/nodePositioning';
import { useThoughtNodes } from './useThoughtNodes';
import { ThoughtNode } from './useThoughtNodes';
import { useBoundsStore } from '../store/boundsStore';

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
      
      // Create bounds only once, outside the loop
      const bounds = createBoundsRightOfNode(responseNode);
      useBoundsStore.getState().setBounds(bounds, true);
      
      // Calculate all positions first before updating ReactFlow
      const existingNodes: ThoughtNode[] = [];
      const nodesToUpdate: { id: string, position: XYPosition }[] = [];

      
      // First, collect all nodes and calculate their positions
      activeThoughtIds.forEach(thoughtId => {
        const thoughtNode = reactFlowInstance.getNode(thoughtId);
        
        if (thoughtNode) {
          // Calculate position with the currently positioned nodes
          const position = boundedAreaStrategy.calculateNodePosition(bounds, existingNodes);
          
          // Add to positions to update
          nodesToUpdate.push({ id: thoughtId, position });
          
          // Add to existing nodes to avoid overlap in future calculations
          const newNodeCopy: ThoughtNode = {
            id: thoughtId,
            type: 'thoughtBubble',
            position,
            data: {
              content: thoughtNode.data.content,
              thoughtId: thoughtId,
              blobVariant: 0
            }
          };
          existingNodes.push(newNodeCopy);
        }
      });
      
      // Update each node with a small delay between updates to ensure ReactFlow processes them correctly
      const updateNodesWithDelay = (index = 0) => {
        if (index >= nodesToUpdate.length) {
          console.log('All nodes repositioned successfully');
          
          // Clear active thoughts after all nodes have been updated
          setTimeout(() => {
            thoughtStore.clearActiveThoughts();
            console.log('Cleared active thoughts after repositioning');
          }, 2000); // Increased to allow transitions to complete
          
          return;
        }
        
        const { id, position } = nodesToUpdate[index];
        
        // Update directly in ReactFlow with a slower animation for repositioning
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => {
            if (node.id === id) {
              return {
                ...node,
                position
              };
            }
            return node;
          })
        );
        
        // Update in our state management - pass special flag for repositioning
        updateThoughtNodePosition(id, position, true);
        
        // Schedule the next update with a delay - increased for more staggered effect
        setTimeout(() => updateNodesWithDelay(index + 1), 150); // More staggered positioning
      };
      
      // Start the sequential update process
      updateNodesWithDelay();
    } catch (error) {
      console.error('Error repositioning active thoughts:', error);
    }
  }, [reactFlowInstance, updateThoughtNodePosition]);

  // Helper function to create a response node from content
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
        // Add a small delay to allow rendering before repositioning
        setTimeout(() => repositionActiveThoughts(nodeId), 200);
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
          duration: 1000, // Longer animation for smoother experience
          nodes: nodesToFit // Only fit view to input and response nodes
        });
      }, 400); // Increased delay to ensure node transitions complete
      
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