import { useState, useCallback, useEffect, useMemo } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition } from 'reactflow';
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
 * Handles synchronization between thought store and ReactFlow
 */
export const useThoughtNodes = () => {
  const { 
    thoughts,
    removingThoughtIds,
    generateThought
  } = useThoughtStore();
  
  // Track ReactFlow nodes in local state
  const [nodes, setNodes] = useState<ThoughtNode[]>([]);
  
  // Track node positions locally
  const [nodePositions, setNodePositions] = useState<Record<string, XYPosition>>({});
  
  // Generate a thought with the correct positioning
  const createThoughtNodeAtPosition = useCallback(async (
    triggerType: EventType, 
    position?: XYPosition,
    textInputNode?: Node
  ) => {
    // Generate thought through the store (data only)
    const thought = await generateThought(triggerType);
    
    if (!thought) {
      return null;
    }
    
    // Determine final position - use provided position, or calculate based on input node
    let finalPosition: XYPosition;
    
    if (position) {
      finalPosition = position;
    } else if (textInputNode) {
      // Calculate position based on the input node and existing nodes
      finalPosition = calculateThoughtNodePosition(
        textInputNode,
        nodes,
        positioningStrategies.aboveInput
      );
    } else {
      // Fallback to random position
      finalPosition = {
        x: getRandomInt(100, 700),
        y: getRandomInt(100, 500)
      };
    }
    
    // Store the position for this thought node
    setNodePositions(prev => ({
      ...prev,
      [thought.id]: finalPosition
    }));
    
    console.log(`💭 New thought node created: ${thought.id}: ${thought.content.text}
Trigger: ${thought.trigger_event.type}
Saliency: ${thought.score.saliency}
Weight: ${thought.score.weight}
Position: (${finalPosition.x.toFixed(2)}, ${finalPosition.y.toFixed(2)})`);
    
    return thought;
  }, [generateThought, nodes]);
  
  // Update the position of a thought node
  const updateThoughtNodePosition = useCallback((nodeId: string, position: XYPosition) => {
    // Update our local positions state
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: position
    }));
  }, []);
  
  // Handle node changes including position updates
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local ReactFlow state
      setNodes((nds) => {
        // Explicitly use the correct return type
        const updatedNodes = applyNodeChanges(changes, nds) as ThoughtNode[];
        return updatedNodes;
      });
      
      // Update positions for position changes
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          updateThoughtNodePosition(change.id, change.position);
        }
      });
    },
    [updateThoughtNodePosition]
  );

  // Create nodes from thoughts and stored positions
  useEffect(() => {
    const newNodes: ThoughtNode[] = thoughts.map(thought => {
      // Get stored position or generate a random one
      const position = nodePositions[thought.id] || { 
        x: getRandomInt(100, 700), 
        y: getRandomInt(100, 500) 
      };
      
      // Create a node for this thought
      return {
        id: thought.id,
        type: 'thoughtBubble',
        position,
        data: {
          content: thought.content.text,
          thoughtId: thought.id,
          blobVariant: thought.id.length % 5, // Deterministic based on ID
          isRemoving: removingThoughtIds.includes(thought.id)
        }
      };
    });
    
    setNodes(newNodes);
  }, [thoughts, nodePositions, removingThoughtIds]);

  return {
    thoughtNodes: nodes,
    onThoughtNodesChange: onNodesChange,
    updateThoughtNodePosition,
    createThoughtNodeAtPosition
  };
}; 