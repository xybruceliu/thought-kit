import { useState, useCallback, useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useTriggerDetection } from './useTriggerDetection';

/**
 * Custom hook that manages text input and integrates with thought generation triggers
 * Handles text changes and triggers thought generation based on configured conditions
 */
export const useTextInput = () => {
  const { updateInput, currentInput } = useThoughtStore();
  const { checkTriggersAndGenerate } = useTriggerDetection();
  
  const [text, setText] = useState(currentInput || '');

  // Update text in component and store
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    updateInput(newText);
    
    // Check all triggers with the new text
    checkTriggersAndGenerate(newText);
  }, [updateInput, checkTriggersAndGenerate]);

  // Check for idle trigger periodically
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      checkTriggersAndGenerate(currentInput);
    }, 1000); // Check every second
    
    return () => clearInterval(idleCheckInterval);
  }, [checkTriggersAndGenerate, currentInput]);

  return {
    text,
    handleTextChange
  };
}; 