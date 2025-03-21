import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { EventType } from '../types/event';
import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { calculateThoughtNodePosition, positioningStrategies } from '../utils';

/**
 * Custom hook that handles thought trigger detection logic
 * Separates trigger detection concerns from the thought store
 */
export const useTriggerDetection = () => {
  const { 
    currentInput,
    lastActivityTimestamp,
    idleTimeThreshold,
    wordCountAtLastGeneration,
    wordCountChangeThreshold,
    sentenceWordThreshold,
    idleTriggerFired,
    thoughtNodes,
    generateThoughtAtPosition,
  } = useThoughtStore();

  // Check if idle time trigger condition is met
  const checkIdleTrigger = useCallback(() => {
    // Only trigger if we haven't already fired an idle trigger and there is input text
    if (idleTriggerFired || !currentInput.trim()) {
      return false;
    }
    
    const now = Date.now();
    if ((now - lastActivityTimestamp) > idleTimeThreshold) {
      console.log(`Trigger: Idle time > ${idleTimeThreshold}ms ⏱️`);
      return true;
    }
    return false;
  }, [idleTriggerFired, currentInput, lastActivityTimestamp, idleTimeThreshold]);

  // Check if word count change trigger condition is met
  const checkWordCountTrigger = useCallback(() => {
    const currentWordCount = currentInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when word count has increased by the threshold
    if (currentWordCount - wordCountAtLastGeneration >= wordCountChangeThreshold) {
      console.log(`Trigger: Word count increase > ${wordCountChangeThreshold} ✍️`);
      return true;
    }
    return false;
  }, [currentInput, wordCountAtLastGeneration, wordCountChangeThreshold]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback((input: string) => {
    // Check if the last character is a sentence-ending punctuation
    const lastChar = input.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    const currentWordCount = input.split(/\s+/).filter(Boolean).length;
    if (currentWordCount - wordCountAtLastGeneration >= sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${sentenceWordThreshold} words 💬`);
      return true;
    }
    return false;
  }, [currentInput, wordCountAtLastGeneration, sentenceWordThreshold]);


  // TESTING: Check if user has typed "t". This is only for testing purposes
  const checkTTrigger = useCallback(() => {
    if (currentInput.includes('*')) {
      console.log(`TESTING Trigger: User typed "*" 🔍`);
      return true;
    }
    return false;
  }, [currentInput]);

  // Function to check all triggers and generate a thought if any is triggered
  const checkTriggersAndGenerate = useCallback((newText: string, textInputNode: ReactFlowNode) => {
    // You can change the strategy here - defaulting to aboveInput
    const position = calculateThoughtNodePosition(
      textInputNode, 
      thoughtNodes, 
      positioningStrategies.aboveInput
    );
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger(newText)) {
      generateThoughtAtPosition('SENTENCE_END', position);
      return true;
    }
    
    // Check for word count trigger
    if (checkWordCountTrigger()) {
      generateThoughtAtPosition('WORD_COUNT_CHANGE', position);
      return true;
    }

    // Check for idle trigger
    if (checkIdleTrigger()) {
      generateThoughtAtPosition('IDLE_TIME', position);
      return true;
    }

    // TESTING: Check if user has typed "t"
    if (checkTTrigger()) {
      generateThoughtAtPosition('IDLE_TIME', position);
      return true;
    }

    return false;
  }, [
    checkSentenceEndTrigger,
    checkWordCountTrigger,
    checkIdleTrigger,
    checkTTrigger,
    generateThoughtAtPosition,
    thoughtNodes
  ]);

  return {
    checkIdleTrigger,
    checkWordCountTrigger,
    checkSentenceEndTrigger,
    checkTTrigger,
    checkTriggersAndGenerate
  };
}; 