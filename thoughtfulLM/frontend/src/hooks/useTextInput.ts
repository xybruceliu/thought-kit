import { useState, useCallback, useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useTriggerDetection } from './useTriggerDetection';
import { XYPosition, Node as ReactFlowNode } from 'reactflow';
/**
 * Custom hook that manages text input and integrates with thought generation triggers
 * Handles text changes and triggers thought generation based on configured conditions
 */
export const useTextInput = () => {
  const { updateInput, currentInput } = useThoughtStore();
  const { checkTriggersAndGenerate } = useTriggerDetection();
  
  const [text, setText] = useState(currentInput || '');
  const [currentTextInputNode, setCurrentTextInputNode] = useState<ReactFlowNode | null>(null);

  // Update text in component and store
  const handleTextChange = useCallback((newText: string, textInputNode?: ReactFlowNode) => {
    setText(newText);
    updateInput(newText);
    if (textInputNode) {
      setCurrentTextInputNode(textInputNode);
      // Check all triggers with the new text
      checkTriggersAndGenerate(newText, textInputNode);
    }
  }, [updateInput, checkTriggersAndGenerate]);

  // Check for idle trigger periodically
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      if (currentTextInputNode && currentInput.trim()) {
        checkTriggersAndGenerate(currentInput, currentTextInputNode);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(idleCheckInterval);
  }, [checkTriggersAndGenerate, currentInput, currentTextInputNode]);

  return {
    text,
    handleTextChange
  };
}; 