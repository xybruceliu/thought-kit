import { useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { getNodeByEntityId, createResponseNode, deleteResponseNode, getNodesByType } from './nodeConnectors';
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from '../store/settingsStore';
import { useReactFlow } from 'reactflow';

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
      
      // under the input node create a response node
      const responseNode = createResponseNode(content, {
        x: inputNode.position.x,
        y: inputNode.position.y + (inputNode.height || 0) + 50
      });
      console.log('Response node created:', responseNode);
      console.log("All response nodes:", getNodesByType('response'));

      // refit the view to fit the new response node
      // reactFlowInstance.fitView();

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