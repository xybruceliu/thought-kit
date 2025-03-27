import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';

/**
 * Component that synchronizes the ThoughtStore state with ReactFlow.
 * This centralizes all ReactFlow updates in one place, simplifying the architecture.
 */
const ReactFlowSynchronizer = () => {
  const { thoughts, removingThoughtIds, nodePositions } = useThoughtStore();
  const { activeInputId } = useInputStore();
  const reactFlowInstance = useReactFlow();
  const [prevThoughtsLength, setPrevThoughtsLength] = useState(thoughts.length);
  
  // Synchronize removingThoughtIds with ReactFlow
  useEffect(() => {
    if (removingThoughtIds.length > 0) {
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
  
  // Synchronize node positions with ReactFlow
  useEffect(() => {
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        const storedPosition = nodePositions[node.id];
        if (storedPosition) {
          return {
            ...node,
            position: storedPosition
          };
        }
        return node;
      })
    );
  }, [nodePositions, reactFlowInstance]);
  
  // Synchronize thought nodes with ReactFlow (adding and removing)
  useEffect(() => {
    // Get current thought IDs
    const thoughtIds = thoughts.map(thought => thought.id);
    
    // Remove nodes that no longer exist in thoughts
    reactFlowInstance.setNodes(nodes => 
      nodes.filter(node => {
        // Keep nodes that are not thought bubbles
        if (node.type !== 'thoughtBubble') return true;
        
        // Keep thought bubbles that still exist in thoughts
        // or are currently being removed (for animation)
        return thoughtIds.includes(node.id) || removingThoughtIds.includes(node.id);
      })
    );
  }, [thoughts, removingThoughtIds, reactFlowInstance]);
  
  // Detect when new thoughts are added and adjust view if needed
  useEffect(() => {
    // If thoughts have been added, fit view
    if (thoughts.length > prevThoughtsLength) {
      // Small delay to ensure nodes are rendered
      console.log('thoughts.length', thoughts.length);
      // Debug to check how many react flow nodes are in the graph
      console.log('reactFlowInstance.getNodes().length', reactFlowInstance.getNodes().length);
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.5,
          includeHiddenNodes: false,
          duration: 800
        });
      }, 300);
    }
    
    // Update previous thoughts length for next comparison
    setPrevThoughtsLength(thoughts.length);
  }, [thoughts.length, prevThoughtsLength, reactFlowInstance]);
  
  // Highlight active input nodes
  useEffect(() => {
    if (activeInputId) {
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id === activeInputId) {
            // Enhance the active input node
            return {
              ...node,
              selected: true
            };
          } else if (node.type === 'textInput') {
            // Ensure other input nodes are not selected
            return {
              ...node,
              selected: false
            };
          }
          return node;
        })
      );
    }
  }, [activeInputId, reactFlowInstance]);
  
  // This component doesn't render anything
  return null;
};

export default ReactFlowSynchronizer; 