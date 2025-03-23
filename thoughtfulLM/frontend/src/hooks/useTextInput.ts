import { useCallback, useEffect, useState } from 'react';
import { useInputStore } from '../store/inputStore';
import { useTriggerDetection } from './useTriggerDetection';
import { Node as ReactFlowNode } from 'reactflow';
/**
 * Custom hook that manages text input and integrates with thought generation triggers
 * Handles text changes and triggers thought generation based on configured conditions
 */
export const useTextInput = () => {
  const { updateInput, currentInput } = useInputStore();
  const { checkTriggersAndGenerate } = useTriggerDetection();
  
  const [currentTextInputNode, setCurrentTextInputNode] = 
    useState<ReactFlowNode | null>(null);

  // Update text in store and check triggers
  const handleTextChange = useCallback((inputText: string, textInputNode?: ReactFlowNode) => {
    // Update global state
    updateInput(inputText);
    
    if (textInputNode) {
      setCurrentTextInputNode(textInputNode);
      // Check all triggers after updating input
      checkTriggersAndGenerate(textInputNode).catch(error => {
        console.error('Error during trigger detection:', error);
      });
    }
  }, [updateInput, checkTriggersAndGenerate]);

  // Check for idle trigger periodically
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      if (currentTextInputNode && currentInput.trim()) {
        checkTriggersAndGenerate(currentTextInputNode).catch(error => {
          console.error('Error during idle trigger detection:', error);
        });
      }
    }, 1000); // Check every second
    
    return () => clearInterval(idleCheckInterval);
  }, [checkTriggersAndGenerate, currentInput, currentTextInputNode]);

  return {
    text: currentInput,
    handleTextChange
  };
}; 