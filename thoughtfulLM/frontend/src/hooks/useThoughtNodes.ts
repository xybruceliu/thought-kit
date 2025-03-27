import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition, useReactFlow } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { Thought } from '../types/thought';
import { EventType } from '../types/event';
import { boundedAreaStrategy, calculateNodePosition, createBoundsAboveNode } from '../utils/nodePositioning';
import { useBoundsStore } from '../store/boundsStore';

// ReactFlow node for thought bubble visualization
export interface ThoughtNode extends Node {
  id: string;
  type: 'thoughtBubble';
  position: XYPosition;
  data: {
    content: string;
    thoughtId: string;  // Store only the ID, not the full thought
    blobVariant: number;
    isRemoving?: boolean;
  };
}

/**
 * Custom hook that manages ReactFlow nodes for thoughts
 */
export const useThoughtNodes = () => {
  const { 
    thoughts,
    removingThoughtIds,
    generateThought,
    setNodePosition,
    getNodePosition,
    setThoughtRemovingCallback
  } = useThoughtStore();
  
  const [nodes, setNodes] = useState<ThoughtNode[]>([]);
  // Store pending position updates to avoid state updates during render
  const pendingPositionUpdatesRef = useRef<Map<string, XYPosition>>(new Map());
  // Get access to the ReactFlow instance
  const reactFlowInstance = useReactFlow();
  
  // Store pending position updates to avoid state updates during render
  useEffect(() => {
    const pendingUpdates = pendingPositionUpdatesRef.current;
    if (pendingUpdates.size > 0) {
      pendingUpdates.forEach((position, id) => {
        setNodePosition(id, position);
      });
      pendingPositionUpdatesRef.current.clear();
    }
  });
  
  // Watch for changes in removingThoughtIds and update ReactFlow accordingly
  useEffect(() => {
    if (removingThoughtIds.length > 0) {
      // Set isRemoving flag directly in ReactFlow instance as well
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (removingThoughtIds.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                isRemoving: true
              }
            };
          }
          return node;
        })
      );
    }
  }, [removingThoughtIds, reactFlowInstance]);
  
  // Create a node from a thought
  const thoughtToNode = useCallback((
    thought: Thought, 
    position?: XYPosition, 
    existingNode?: ThoughtNode,
    shouldUpdateStore: boolean = false
  ): ThoughtNode => {
    // Only update store position if explicitly requested
    if (position && shouldUpdateStore) {
      pendingPositionUpdatesRef.current.set(thought.id, position);
    }
    
    // Get position from store, provided position, or default
    const finalPosition = position || getNodePosition(thought.id) || { x: 0, y: 0 };
    
    return {
      id: thought.id,
      type: 'thoughtBubble',
      position: finalPosition,
      data: {
        content: thought.content.text,
        thoughtId: thought.id,
        blobVariant: existingNode?.data.blobVariant || Math.floor(Math.random() * 5),
        isRemoving: removingThoughtIds.includes(thought.id)
      },
      // Preserve any other ReactFlow properties
      ...(existingNode && { 
        selected: existingNode.selected,
        dragging: existingNode.dragging,
      })
    };
  }, [removingThoughtIds, getNodePosition]);
  
  // Generate a thought and create a node for it
  const createThoughtNodeAtPosition = useCallback(async (
    triggerType: EventType, 
    position?: XYPosition,
    textInputNode?: Node
  ) => {
    // Calculate position 
    let finalPosition = position;
    
    if (!finalPosition && textInputNode) {
      // Set bounds above the input node - this now automatically updates the global store
      const bounds = createBoundsAboveNode(textInputNode);
      
      // Get the list of active thought IDs from the thought store
      const activeThoughtIds = useThoughtStore.getState().activeThoughtIds;
      
      // Filter nodes to only include active ones that haven't been submitted yet
      const activeNodes = nodes.filter(node => 
        activeThoughtIds.includes(node.id)
      );
      
      // Use active nodes for positioning so we avoid overlaps with existing thoughts
      // but ignore nodes that have been submitted and moved to the right
      finalPosition = calculateNodePosition(activeNodes, boundedAreaStrategy);
    }
    
    // Generate thought through the store
    const thought = await generateThought(triggerType, finalPosition);
    if (!thought) return null;
    
    // Create the node and add it to our state
    const newNode = thoughtToNode(thought, finalPosition, undefined, false);
    setNodes(currentNodes => [...currentNodes, newNode]);

    console.log(`💭 New thought node created: ${thought.id} at (${newNode.position.x.toFixed(2)}, ${newNode.position.y.toFixed(2)})`);
    return thought;
  }, [generateThought, nodes, thoughtToNode]);
  
  // Update nodes when the thoughts change
  useEffect(() => {
    setNodes(currentNodes => {
      // Map existing nodes by ID
      const existingNodesMap = new Map(
        currentNodes.map(node => [node.id, node])
      );
      
      // Map thoughts to nodes, preserving existing node properties
      return thoughts.map(thought => {
        const existingNode = existingNodesMap.get(thought.id);
        const position = getNodePosition(thought.id) || existingNode?.position;
        return thoughtToNode(thought, position, existingNode, false);
      });
    });
  }, [thoughts, thoughtToNode, getNodePosition]);
  
  // Handle ReactFlow node changes and update positions in the store
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => {
      const updatedNodes = applyNodeChanges(changes, nds) as ThoughtNode[];
      
      // Queue position updates instead of updating immediately
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          pendingPositionUpdatesRef.current.set(change.id, change.position);
        }
      });
      
      return updatedNodes;
    });
  }, []);
  
  // Update a node's position in state and store
  const updateThoughtNodePosition = useCallback((nodeId: string, position: XYPosition) => {
    console.log(`DEBUG 💭 Updating thought node position for ${nodeId} to (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
    // Queue the position update for the store
    pendingPositionUpdatesRef.current.set(nodeId, position);
    
    // Update the node in local state
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === nodeId) {
          console.log('!!!YES DEBUG: Updating node position:', { ...node, position });
          return { ...node, position };
        }
        return node;
      })
    );
    
    // Update the node position directly in ReactFlow instance
    // This ensures the visual update happens immediately
    const rfNode = reactFlowInstance.getNode(nodeId);
    if (rfNode) {
      console.log('🔄 Directly updating ReactFlow node:', nodeId);
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              position
            };
          }
          return node;
        })
      );
    } else {
      console.warn('⚠️ ReactFlow node not found:', nodeId);
    }
  }, [reactFlowInstance]);

  // Function to mark a thought node as removing in ReactFlow directly
  const markThoughtNodeAsRemoving = useCallback((thoughtId: string) => {
    console.log(`🗑️ Marking ReactFlow node for removal: ${thoughtId}`);
    
    // Update in ReactFlow instance directly
    const rfNode = reactFlowInstance.getNode(thoughtId);
    if (rfNode) {
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id === thoughtId) {
            return {
              ...node,
              data: {
                ...node.data,
                isRemoving: true
              }
            };
          }
          return node;
        })
      );
    } else {
      console.warn(`⚠️ ReactFlow node not found for removal: ${thoughtId}`);
    }
    
    // Also update in our local state
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === thoughtId) {
          return {
            ...node,
            data: {
              ...node.data,
              isRemoving: true
            }
          };
        }
        return node;
      })
    );
  }, [reactFlowInstance]);

  // Register the function to mark a thought node as removing with the store
  useEffect(() => {
    // This function will be called by the store when a thought is being removed
    setThoughtRemovingCallback(markThoughtNodeAsRemoving);
    
    // Cleanup function
    return () => {
      setThoughtRemovingCallback(() => {});
    };
  }, [markThoughtNodeAsRemoving, setThoughtRemovingCallback]);

  return {
    thoughtNodes: nodes,
    onThoughtNodesChange: onNodesChange,
    updateThoughtNodePosition,
    createThoughtNodeAtPosition,
    markThoughtNodeAsRemoving
  };
}; 


