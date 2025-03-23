import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { EventType } from '../types/event';
import { Node as ReactFlowNode } from 'reactflow';
import { calculateThoughtNodePosition, positioningStrategies } from '../utils';

/**
 * Custom hook that handles thought trigger detection logic
 * Separates trigger detection concerns from the thought store
 */
export const useTriggerDetection = () => {
  const { 
    thoughtNodes,
    generateThoughtAtPosition,
  } = useThoughtStore();
  
  const {
    currentInput,
    lastActivityTimestamp,
    idleTimeThreshold,
    wordCountAtLastGeneration,
    wordCountChangeThreshold,
    sentenceWordThreshold,
    idleTriggerFired,
    setIdleTriggerFired,
    updateWordCountBaseline,
    updateActivityTimestamp
  } = useInputStore();

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
  }, [idleTriggerFired, lastActivityTimestamp, idleTimeThreshold, currentInput]);
  
  // Check if word count change trigger condition is met
  const checkWordCountTrigger = useCallback(() => {
    const currentWordCount = currentInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when word count has increased by the threshold
    if (currentWordCount - wordCountAtLastGeneration >= wordCountChangeThreshold) {
      console.log(`Trigger: Word count increase > ${wordCountChangeThreshold} ✍️`);
      return true;
    }
    return false;
  }, [wordCountAtLastGeneration, wordCountChangeThreshold, currentInput]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback(() => {
    // Check if the last character is a sentence-ending punctuation
    const lastChar = currentInput.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    const currentWordCount = currentInput.split(/\s+/).filter(Boolean).length;
    if (currentWordCount - wordCountAtLastGeneration >= sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${sentenceWordThreshold} words 💬`);
      return true;
    }
    return false;
  }, [wordCountAtLastGeneration, sentenceWordThreshold, currentInput]);


  // TESTING: Check if user has typed "*". This is only for testing purposes
  const checkAstTrigger = useCallback(() => {
    if (currentInput.includes('*')) {
      console.log(`TESTING Trigger: User typed "*" 🔍`);
      return true;
    }
    return false;
  }, [currentInput]);

  // Function to check all triggers and generate a thought if any is triggered
  const checkTriggersAndGenerate = useCallback(async (textInputNode: ReactFlowNode) => {
    // You can change the strategy here - defaulting to aboveInput
    const position = calculateThoughtNodePosition(
      textInputNode, 
      thoughtNodes, 
      positioningStrategies.aboveInput
    );
    
    const currentWordCount = currentInput.split(/\s+/).filter(Boolean).length;
    let thoughtGenerated = false;
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger()) {
      // Update word count baseline BEFORE generating thought to prevent repeat triggers
      updateWordCountBaseline(currentWordCount);
      
      const thought = await generateThoughtAtPosition('SENTENCE_END', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for word count trigger
    else if (checkWordCountTrigger()) {
      // Update word count baseline BEFORE generating thought to prevent repeat triggers
      updateWordCountBaseline(currentWordCount);
      
      const thought = await generateThoughtAtPosition('WORD_COUNT_CHANGE', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for idle trigger
    else if (checkIdleTrigger()) {
      // Set the idle trigger fired state to true BEFORE generating a thought to prevent repeat triggers
      setIdleTriggerFired(true);

      const thought = await generateThoughtAtPosition('IDLE_TIME', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for test trigger
    else if (checkAstTrigger()) {
      const thought = await generateThoughtAtPosition('NAMED_ENTITY', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    
    // Update activity timestamp if a thought was generated
    if (thoughtGenerated) {
      updateActivityTimestamp();
      return true;
    }
    
    return false;
  }, [
    checkSentenceEndTrigger, 
    checkWordCountTrigger, 
    checkIdleTrigger, 
    checkAstTrigger, 
    generateThoughtAtPosition, 
    thoughtNodes,
    currentInput,
    updateWordCountBaseline,
    setIdleTriggerFired,
    updateActivityTimestamp
  ]);

  return {
    checkTriggersAndGenerate,
    checkIdleTrigger,
    checkWordCountTrigger,
    checkSentenceEndTrigger
  };
}; 