import { useState, useCallback, useEffect, useMemo } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition, Position } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { Thought } from '../types/thought';
import { getRandomInt } from '../utils';
import { EventType } from '../types/event';
import { calculateThoughtNodePosition, positioningStrategies } from '../utils/nodePositioning';

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
    generateThought
  } = useThoughtStore();
  
  // Single source of truth - just the nodes
  const [nodes, setNodes] = useState<ThoughtNode[]>([]);
  
  // Create a node from a thought
  const thoughtToNode = useCallback((
    thought: Thought, 
    position?: XYPosition, 
    existingNode?: ThoughtNode
  ): ThoughtNode => {
    
    return {
      id: thought.id,
      type: 'thoughtBubble',
      position: position || { x: 0, y: 0 },
      data: {
        content: thought.content.text,
        thoughtId: thought.id,
        blobVariant: existingNode?.data.blobVariant || thought.id.length % 5,
        isRemoving: removingThoughtIds.includes(thought.id)
      },
      // Preserve any other ReactFlow properties
      ...(existingNode && { 
        selected: existingNode.selected,
        dragging: existingNode.dragging,
        // Include other ReactFlow properties as needed
      })
    };
  }, [removingThoughtIds]);
  
  // Generate a thought and create a node for it
  const createThoughtNodeAtPosition = useCallback(async (
    triggerType: EventType, 
    position?: XYPosition,
    textInputNode?: Node
  ) => {
    console.log(`DEBUG: createThoughtNodeAtPosition called with:
      triggerType: ${triggerType}
      position: ${position ? `(${position.x}, ${position.y})` : 'undefined'}
      textInputNode: ${textInputNode ? `ID: ${textInputNode.id}, Position: (${textInputNode.position.x}, ${textInputNode.position.y})` : 'undefined'}`);
    
    // Generate thought through the store
    const thought = await generateThought(triggerType);
    if (!thought) return null;
    
    // Determine final position with a default
    let finalPosition: XYPosition | undefined = position;
    
    // Calculate position if needed
    if (!finalPosition && textInputNode) {
      console.log(`DEBUG: Calculating position with textInputNode:
        ID: ${textInputNode.id}
        Position: (${textInputNode.position.x}, ${textInputNode.position.y})
        Width: ${textInputNode.width || 'undefined'}
        Height: ${textInputNode.height || 'undefined'}`);
      
      finalPosition = calculateThoughtNodePosition(
        textInputNode,
        nodes,
        positioningStrategies.aboveInput
      );
      
      console.log(`DEBUG: Position calculation result: ${finalPosition ? `(${finalPosition.x}, ${finalPosition.y})` : 'undefined'}`);
    } else {
      console.log(`DEBUG: Skipping position calculation. Reason: ${finalPosition ? 'Position already provided' : 'textInputNode is undefined'}`);
    }
    
    // Create the node and add it to our state
    const newNode = thoughtToNode(thought, finalPosition);
      setNodes(currentNodes => [...currentNodes, newNode]);

    console.log(`DEBUG THOUGHT Position: ${finalPosition?.x}, ${finalPosition?.y}`);
    console.log(`DEBUG NEW NODE Position: ${newNode.position.x}, ${newNode.position.y}`);

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
      
      // Map thoughts to nodes, preserving existing node properties when possible
      return thoughts.map(thought => 
        thoughtToNode(thought, undefined, existingNodesMap.get(thought.id))
      );
      });
  }, [thoughts, thoughtToNode]);
  
  // Handle ReactFlow node changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds) as ThoughtNode[]);
  }, []);
  
  // Simple function to explicitly update a node's position
  const updateThoughtNodePosition = useCallback((nodeId: string, position: XYPosition) => {
    setNodes(currentNodes => 
      currentNodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    );
  }, []);

  return {
    thoughtNodes: nodes,
    onThoughtNodesChange: onNodesChange,
    updateThoughtNodePosition,
    createThoughtNodeAtPosition
  };
}; 