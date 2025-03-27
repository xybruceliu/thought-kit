import { useCallback, useState, useEffect, useRef } from 'react';
import { 
  Node, 
  NodeChange,
  applyNodeChanges,
  XYPosition,
  ReactFlowInstance
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { createBoundsRightOfNode, calculateNodePosition, boundedAreaStrategy } from '../utils/nodePositioning';
import { useBoundsStore } from '../store/boundsStore';
import { useThoughtNodes, ThoughtNode } from './useThoughtNodes';

// Define the type for a response node
export interface ResponseNode extends Node {
  type: 'response';
  data: {
    content: string;
    onRenderComplete?: (nodeId: string) => void;
  };
}

// Custom hook for managing response nodes in ReactFlow
export const useResponseNodes = () => {
  // State for response nodes
  const [responseNodes, setResponseNodes] = useState<ResponseNode[]>([]);
  const { updateThoughtNodePosition, thoughtNodes } = useThoughtNodes();
  
  // Keep a ref to the current nodes to avoid stale closures
  const responseNodesRef = useRef<ResponseNode[]>([]);
  
  // Store a reference to the ReactFlow instance
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  
  // Update the ref whenever responseNodes changes
  useEffect(() => {
    responseNodesRef.current = responseNodes;
  }, [responseNodes]);
  
  // Method to set the reactFlow instance - should be called from component
  const setReactFlowInstance = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
  }, []);
  
  // Handle changes to response nodes
  const onResponseNodesChange = useCallback((changes: NodeChange[]) => {
    setResponseNodes((nds) => applyNodeChanges(
      // Only apply changes to response nodes - filter out changes for other node types
      changes.filter(change => {
        // For each change, check if it affects our response nodes
        if ('id' in change) {
          // It's a change with an ID property (position, remove, select)
          return nds.some(node => node.id === change.id);
        }
        return false; // Ignore other types of changes
      }),
      nds
    ) as ResponseNode[]);
  }, []);

  // Reposition active thoughts after a response is created
  const repositionActiveThoughts = useCallback((responseNodeId: string, responseNodePosition: XYPosition) => {
    try {
      console.log("DEBUG: Repositioning active thoughts");
      const thoughtStore = useThoughtStore.getState();
      console.log("DEBUG: Thought store:", thoughtStore);
      const activeThoughtIds = thoughtStore.activeThoughtIds;
      console.log("DEBUG: Active thought IDs:", activeThoughtIds);
      
      if (activeThoughtIds.length === 0) {
        console.log("DEBUG: No active thoughts to reposition");
        return; // No active thoughts to reposition
      }
      
      // Get the current responseNodes from our ref
      const currentNodes = responseNodesRef.current;
      const responseNode = currentNodes.find(node => node.id === responseNodeId);
      console.log("DEBUG: Response node:", responseNode);
      
      if (!responseNode) {
        console.error('Response node not found');
        return;
      }
      
      // Create bounds to the right of the response node
      const bounds = createBoundsRightOfNode(responseNode);

      // For testing, just move the first active thought to the right of the response node
      const firstThoughtId = activeThoughtIds[0];
      const firstThought = thoughtStore.thoughts.find(t => t.id === firstThoughtId);
      console.log("DEBUG: First thought:", firstThought);
      if (firstThought) {
        const firstThoughtNode = thoughtNodes.find(node => node.id === firstThought.id);
        console.log("DEBUG: First thought node:", firstThoughtNode);
        if (firstThoughtNode) {
          const position = calculateNodePosition([firstThoughtNode]);
          console.log("DEBUG: Calculated position:", position);
          
          // Use ReactFlow's direct node manipulation for immediate update
          // Only do this if we have a ReactFlow instance
          if (reactFlowInstanceRef.current) {
            reactFlowInstanceRef.current.setNodes(nodes => 
              nodes.map(node => {
                if (node.id === firstThoughtId) {
                  return { ...node, position };
                }
                return node;
              })
            );
            console.log("DEBUG: Position updated via ReactFlow direct manipulation");
          }
          
          // Also update our position tracking in the store
          updateThoughtNodePosition(firstThoughtId, position);
        }
      }
      
      // Clear active thoughts after a delay to ensure repositioning is complete
      setTimeout(() => {
        thoughtStore.clearActiveThoughts();
      }, 500);
    } catch (error) {
      console.error('Error repositioning active thoughts:', error);
    }
  }, [thoughtNodes, updateThoughtNodePosition]);

  // Add a new response node
  const addResponseNode = useCallback((content: string, position: XYPosition) => {
    const id = `response-${uuidv4().substring(0, 8)}`;
    
    // Handle render completion callback - uses the ref value to avoid stale closures
    const handleRenderComplete = (nodeId: string) => {
      console.log("DEBUG: Render complete called for node:", nodeId);
      console.log("DEBUG: Current nodes in ref:", responseNodesRef.current);
      repositionActiveThoughts(nodeId, position);
    };
    
    const newNode: ResponseNode = {
      id,
      type: 'response',
      position,
      draggable: false,
      data: {
        content,
        onRenderComplete: handleRenderComplete
      }
    };

    setResponseNodes((nds) => [...nds, newNode]);
    return id;
  }, [repositionActiveThoughts]);

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
      console.log("DEBUG: Created response node:", nodeId);
      
      return nodeId;
    } catch (error) {
      console.error('Error creating response node:', error);
      return null;
    }
  }, [addResponseNode]);

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
    repositionActiveThoughts,
    setReactFlowInstance
  };
};

export default useResponseNodes; 