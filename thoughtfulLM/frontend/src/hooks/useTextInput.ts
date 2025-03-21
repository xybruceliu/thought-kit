import { useState, useCallback, useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { EventType } from '../types/event';

/**
 * Custom hook that manages text input and integrates with thought generation triggers
 * Handles text changes and triggers thought generation based on configured conditions
 */
export const useTextInput = () => {
  const { 
    updateInput, 
    currentInput,
    generateThoughtAtPosition,
    checkIdleTrigger,
    checkWordCountTrigger,
    checkSentenceEndTrigger
  } = useThoughtStore();
  
  const [text, setText] = useState(currentInput || '');
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // Update text in component and store
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    updateInput(newText);
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger(newText)) {
      generateThoughtAtPosition('SENTENCE_END');
    }
    
    // Check for word count trigger
    if (checkWordCountTrigger()) {
      generateThoughtAtPosition('WORD_COUNT_CHANGE');
    }
  }, [updateInput, checkSentenceEndTrigger, checkWordCountTrigger, generateThoughtAtPosition]);

  // Check for idle trigger periodically
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      if (checkIdleTrigger()) {
        generateThoughtAtPosition('IDLE_TIME');
        setLastCheckTime(Date.now());
      }
    }, 1000); // Check every second
    
    return () => clearInterval(idleCheckInterval);
  }, [checkIdleTrigger, generateThoughtAtPosition]);

  return {
    text,
    handleTextChange
  };
}; 