import { useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { 
  getNodeByEntityId, 
  createResponseNode, 
  deleteResponseNode, 
  getNodesByType, 
  getNodeById,
  repositionNodeByEntityId 
} from './nodeConnectors';
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from '../store/settingsStore';
import { useReactFlow, Node as ReactFlowNode } from 'reactflow';
import { createBoundsRightOfNode, boundedAreaStrategy } from '../utils/nodePositioning';
import { NodeData } from '../store/nodeStore';

/**
 * Hook that handles response creation after thought generation
 * Sets up the onResponseCreated callback in the thought store
 * 
 * @returns An object with the status of the response handler
 */
export const useResponseHandling = () => {
  const reactFlowInstance = useReactFlow();
  
  // Set up response handler when the hook is initialized
  useEffect(() => {
    // Define the response creation handler
    useThoughtStore.getState().onResponseCreated = (content) => {

      // if interface 2, clear existing response nodes
      if (useSettingsStore.getState().interfaceType === 2) {
        const responseNodes = getNodesByType('response');
        responseNodes.forEach(node => {
          if ('responseId' in node.data) {
            deleteResponseNode(node.data.responseId);
          }
        });
      }

      // Get the active input node
      const activeInputId = useInputStore.getState().activeInputId;
      
      if (!activeInputId) {
        console.warn('No active input found for response creation');
        return '';
      }
      
      const inputNode = getNodeByEntityId('input', activeInputId);
      
      if (!inputNode) {
        console.warn('Could not find input node for response creation');
        return '';
      }
      
      // if interface 1, disable the input node by setting activeInputId to empty string    
      if (useSettingsStore.getState().interfaceType === 1) {
        useInputStore.getState().setActiveInputId('');
      }
      
      // Generate a unique ID for the response
      const responseId = uuidv4();
      
      // Create a response node under the input node
      const responseNode = createResponseNode(content, {
        x: inputNode.position.x,
        y: inputNode.position.y + (inputNode.height || 0) + 30
      });
      
      // If interface 1, move active thoughts to the right of the response node
      if (useSettingsStore.getState().interfaceType === 1) {
        setTimeout(() => {
          // Get active thoughts
          const { activeThoughtIds } = useThoughtStore.getState();
          if (activeThoughtIds.length === 0) return;
          
          // Create bounds to the right of the response node
          const bounds = createBoundsRightOfNode(responseNode);
          
          // Get the active thoughts as nodes (filtered to remove any undefined values)
          const activeThoughtNodes = activeThoughtIds
            .map(id => getNodeByEntityId('thought', id))
            .filter((node): node is ReactFlowNode<NodeData> => node !== undefined);
          
          // Reposition each thought node using the bounded area strategy
          activeThoughtIds.forEach((thoughtId, index) => {
            // Only proceed if the node exists
            const node = getNodeByEntityId('thought', thoughtId);
            if (!node) return;
            
            // Calculate position within bounds
            const position = boundedAreaStrategy.calculateNodePosition(
              bounds, 
              activeThoughtNodes.slice(0, index), // Only consider nodes that have already been positioned
              'left'
            );
            
            // Reposition the node
            repositionNodeByEntityId('thought', thoughtId, position);
          });

          // clear active thoughts
          useThoughtStore.getState().clearActiveThoughts(); 
          
          // Fit the view to include input and response node
          reactFlowInstance.fitView({
            padding: 0.5,
            minZoom: 0.5,
            maxZoom: 1.5,
            duration: 500,
            nodes: [
              { id: inputNode.id },
              { id: responseNode.id }
            ]
          });
        }, 100); // Short delay to ensure the response node is fully rendered
      }

      return responseId;
    };
    
    // Clean up handler when component unmounts
    return () => {
      useThoughtStore.getState().onResponseCreated = undefined;
    };
  }, [reactFlowInstance]);
  
  return {
    isHandlingResponses: true
  };
}; 