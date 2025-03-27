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
import { createBoundsRightOfNode, boundedAreaStrategy, createBoundsLeftOfNode } from '../utils/nodePositioning';
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
      
      // Store all input nodes before making changes to ensure they're preserved
      const allNodes = reactFlowInstance.getNodes();
      const inputNodes = allNodes.filter(node => node.type === 'textInput');
      
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
          
          // Ensure input nodes are preserved when we're done repositioning
          reactFlowInstance.setNodes(nodes => {
            // Filter out any duplicate input nodes
            const currentInputNodeIds = inputNodes.map(node => node.id);
            const nonDuplicateCurrentNodes = nodes.filter(node => 
              node.type !== 'textInput' || !currentInputNodeIds.includes(node.id)
            );
            
            // Combine input nodes with other nodes
            return [...inputNodes, ...nonDuplicateCurrentNodes.filter(node => node.type !== 'textInput')];
          });
          
          // Clear active thoughts after all nodes have been updated
          setTimeout(() => {
            thoughtStore.clearActiveThoughts();
            console.log('Cleared active thoughts after repositioning');
          }, 2000); // Increased to allow transitions to complete
          
          return;
        }
        
        const { id, position } = nodesToUpdate[index];
        
        // Update directly in ReactFlow with a slower animation for repositioning
        reactFlowInstance.setNodes(nodes => {
          // Preserve input nodes in each update
          const currentInputNodes = nodes.filter(node => node.type === 'textInput');
          const updatedNodes = nodes.map(node => {
            if (node.id === id) {
              return {
                ...node,
                position
              };
            }
            return node;
          });
          
          // If for some reason input nodes were filtered out, add them back
          if (currentInputNodes.length === 0 && inputNodes.length > 0) {
            return [...inputNodes, ...updatedNodes.filter(node => node.type !== 'textInput')];
          }
          
          return updatedNodes;
        });
        
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
      
      // Get the active input node ID
      const activeInputId = useInputStore.getState().activeInputId;
      if (!activeInputId) {
        console.error('No active input node found');
        return null;
      }
      
      // Store all nodes from ReactFlow before making changes to ensure consistency
      const allNodes = reactFlowInstance.getNodes();
      
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
      
      // Directly add the response node to ReactFlow's state to ensure it exists
      const responseNode: ResponseNode = {
        id: nodeId,
        type: 'response',
        position,
        draggable: false,
        data: {
          content
        }
      };
      
      // Make sure we preserve all input nodes and add the new response node in ReactFlow's internal state
      reactFlowInstance.setNodes((nodes) => {
        // Get all input nodes from current nodes
        const inputNodes = allNodes.filter(node => node.type === 'textInput');
        // Keep all non-input and non-response nodes from the current state
        const otherNodes = nodes.filter(node => node.type !== 'textInput' && node.type !== 'response');
        // Combine them to ensure input nodes aren't lost and add the new response node
        return [...inputNodes, ...otherNodes, responseNode];
      });
      
      // Reposition active thoughts to the right of the new response node
      if (nodeId) {
        // Increase delay to ensure rendering before repositioning
        setTimeout(() => {
          // Double-check the node exists before repositioning
          const checkNodeExists = reactFlowInstance.getNode(nodeId);
          if (checkNodeExists) {
            repositionActiveThoughts(nodeId);
          } else {
            console.error('Response node still not found after delay, cannot reposition thoughts');
          }
        }, 500);
      }
      
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