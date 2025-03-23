import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { calculateThoughtNodePosition, positioningStrategies } from '../utils';

/**
 * Custom hook that handles thought trigger detection logic
 * Separates trigger detection concerns from the thought store
 */
export const useTriggerDetection = () => {
  const reactFlowInstance = useReactFlow();
  const { 
    thoughtNodes,
    generateThoughtAtPosition,
  } = useThoughtStore();
  
  const {
    currentInput,
    inputAtLastGeneration,
    newInput,
    lastActivityTimestamp,
    idleTimeThreshold,
    wordCountChangeThreshold,
    sentenceWordThreshold,
    idleTriggerFired,
    setIdleTriggerFired,
    updateInputBaseline,
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
    // Use newInput instead of calculating difference from currentInput
    const newWordCount = newInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when new word count has reached the threshold
    if (newWordCount >= wordCountChangeThreshold) {
      console.log(`Trigger: Word count increase > ${wordCountChangeThreshold} ✍️`);
      console.log(`Old text: "${inputAtLastGeneration}"`);
      console.log(`New text: "${newInput}"`);
      return true;
    }
    return false;
  }, [newInput, wordCountChangeThreshold, inputAtLastGeneration]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback(() => {
    // Check if the last character of the new input or current input is a sentence-ending punctuation
    const lastChar = newInput.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Use newInput word count for sentence trigger
    const newWordCount = newInput.split(/\s+/).filter(Boolean).length;
    if (newWordCount >= sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${sentenceWordThreshold} words 💬`);
      console.log(`Old text: "${inputAtLastGeneration}"`);
      console.log(`New text: "${newInput}"`);
      return true;
    }
    return false;
  }, [newInput, sentenceWordThreshold, inputAtLastGeneration]);


  // TESTING: Check if user has typed "*". This is only for testing purposes
  const checkAstTrigger = useCallback(() => {
    if (currentInput.includes('*')) {
      console.log(`TESTING Trigger: User typed "*" 🔍`);
      return true;
    }
    return false;
  }, [currentInput]);

  // Function to check all triggers and generate thoughts
  const checkTriggersAndGenerate = useCallback(async (textInputNode: ReactFlowNode) => {
    // You can change the strategy here - defaulting to aboveInput
    const position = calculateThoughtNodePosition(
      textInputNode, 
      thoughtNodes, 
      positioningStrategies.aboveInput
    );
    
    let thoughtGenerated = false;
    
    // Save the current input at the time we check triggers
    const inputAtCheckTime = currentInput;
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger()) {
      // Update the input baseline BEFORE generating a thought
      updateInputBaseline(inputAtCheckTime);

      const thought = await generateThoughtAtPosition('SENTENCE_END', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for word count trigger
    else if (checkWordCountTrigger()) {
      updateInputBaseline(inputAtCheckTime);
      
      const thought = await generateThoughtAtPosition('WORD_COUNT_CHANGE', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for idle trigger
    else if (checkIdleTrigger()) {
      // Set the idle trigger fired state to true BEFORE generating a thought to prevent repeat triggers
      setIdleTriggerFired(true);
      updateInputBaseline(inputAtCheckTime);

      const thought = await generateThoughtAtPosition('IDLE_TIME', position);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for test trigger
    else if (checkAstTrigger()) {
      updateInputBaseline(inputAtCheckTime);
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
    updateInputBaseline,
    setIdleTriggerFired,
    updateActivityTimestamp
  ]);

  // Handle clicks on the pane to generate thoughts
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      
      // Get position in the flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Apply offset to position bubbles to the top left of cursor
      const offsetX = 80;  // pixels to the left
      const offsetY = 50;  // pixels to the top
      
      // Generate a thought at the clicked position with offsets
      try {
        console.log('Trigger: Pane click 🖱️');
        const thought = await generateThoughtAtPosition('CLICK', {
          x: position.x - offsetX,
          y: position.y - offsetY
        });
        
        if (thought) {
          // Save the input at the time of click generation
          updateInputBaseline(currentInput);
        }
      } catch (error) {
        console.error('Error generating thought on pane click:', error);
      }
    },
    [reactFlowInstance, generateThoughtAtPosition, currentInput, updateInputBaseline]
  );

  return {
    checkTriggersAndGenerate,
    checkIdleTrigger,
    checkWordCountTrigger,
    checkSentenceEndTrigger,
    onPaneClick
  };
}; 