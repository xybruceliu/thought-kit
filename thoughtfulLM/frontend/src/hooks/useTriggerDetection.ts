import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { useThoughtNodes } from './useThoughtNodes';

/**
 * Custom hook that handles thought trigger detection logic
 * Separates trigger detection concerns from the thought store
 */
export const useTriggerDetection = () => {
  const reactFlowInstance = useReactFlow();
  const { 
    thoughtNodes,
    createThoughtNodeAtPosition
  } = useThoughtNodes();
  
  const {
    getInputData,
    idleTimeThreshold,
    wordCountChangeThreshold,
    sentenceWordThreshold,
    updateInputBaseline,
    updateActivityTimestamp,
    setIdleTriggerFired
  } = useInputStore();

  // Check if idle time trigger condition is met
  const checkIdleTrigger = useCallback((nodeId: string) => {
    const inputData = getInputData(nodeId);
    
    // Only trigger if we haven't already fired an idle trigger and there is input text
    if (inputData.idleTriggerFired || !inputData.currentInput.trim()) {
      return false;
    }
    
    const now = Date.now();
    // if ((now - inputData.lastActivityTimestamp) > idleTimeThreshold) {
    //   console.log(`Trigger: Idle time > ${idleTimeThreshold}ms ⏱️ for node ${nodeId}`);
    //   return true;
    // }
    return false;
  }, [getInputData, idleTimeThreshold]);
  
  // Check if word count change trigger condition is met
  const checkWordCountTrigger = useCallback((nodeId: string) => {
    const inputData = getInputData(nodeId);
    
    // Use newInput instead of calculating difference from currentInput
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when new word count has reached the threshold and the last character is a " " to make sure user finished typing a word
    if (newWordCount >= wordCountChangeThreshold && inputData.newInput.slice(-1) === " ") {
      console.log(`Trigger: Word count increase > ${wordCountChangeThreshold} ✍️ for node ${nodeId}`);
      return true;
    }
    return false;
  }, [getInputData, wordCountChangeThreshold]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback((nodeId: string) => {
    const inputData = getInputData(nodeId);
    
    // Check if the last character of the new input or current input is a sentence-ending punctuation
    const lastChar = inputData.newInput.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Use newInput word count for sentence trigger
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    if (newWordCount >= sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${sentenceWordThreshold} words 💬 for node ${nodeId}`);
      return true;
    }
    return false;
  }, [getInputData, sentenceWordThreshold]);


  // TESTING: Check if user has typed "*". This is only for testing purposes
  const checkAstTrigger = useCallback((nodeId: string) => {
    const inputData = getInputData(nodeId);
    
    if (inputData.currentInput.includes('*')) {
      console.log(`TESTING Trigger: User typed "*" 🔍 for node ${nodeId}`);
      return true;
    }
    return false;
  }, [getInputData]);

  // Function to check all triggers and generate thoughts
  const checkTriggersAndGenerate = useCallback(async (textInputNode: ReactFlowNode, nodeId: string) => {
    let thoughtGenerated = false;
    
    // Get input data for this specific node
    const inputData = getInputData(nodeId);
    
    // Save the current input at the time we check triggers
    const inputAtCheckTime = inputData.currentInput;
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger(nodeId)) {
      // Update the input baseline BEFORE generating a thought
      updateInputBaseline(nodeId, inputAtCheckTime);

      const thought = await createThoughtNodeAtPosition('SENTENCE_END', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for word count trigger
    else if (checkWordCountTrigger(nodeId)) {
      updateInputBaseline(nodeId, inputAtCheckTime);
      
      const thought = await createThoughtNodeAtPosition('WORD_COUNT_CHANGE', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for idle trigger
    else if (checkIdleTrigger(nodeId)) {
      // Set the idle trigger fired state to true BEFORE generating a thought to prevent repeat triggers
      setIdleTriggerFired(nodeId, true);
      updateInputBaseline(nodeId, inputAtCheckTime);

      const thought = await createThoughtNodeAtPosition('IDLE_TIME', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for test trigger
    else if (checkAstTrigger(nodeId)) {
      updateInputBaseline(nodeId, inputAtCheckTime);
      const thought = await createThoughtNodeAtPosition('NAMED_ENTITY', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;    
      }
    }
    
    // Update activity timestamp if a thought was generated
    if (thoughtGenerated) {
      updateActivityTimestamp(nodeId);
      return true;
    }
    
    return false;
  }, [
    checkSentenceEndTrigger, 
    checkWordCountTrigger, 
    checkIdleTrigger, 
    checkAstTrigger, 
    createThoughtNodeAtPosition, 
    getInputData,
    updateInputBaseline,
    setIdleTriggerFired,
    updateActivityTimestamp
  ]);

  // Handle clicks on the pane to generate thoughts
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      // Get the active input node ID
      const activeInputId = useInputStore.getState().activeInputId;
      if (!activeInputId) {
        console.warn('No active input node to associate with click event');
        return;
      }
      
      // Find the active input node from the nodes
      const activeInputNode = reactFlowInstance.getNode(activeInputId);
      if (!activeInputNode) {
        console.warn('Could not find active input node');
        return;
      }
      
      // Get position in the flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Apply offset to position bubbles to the top left of cursor
      const offsetX = 0;  // pixels to the left
      const offsetY = 0;  // pixels to the top
      
      // Calculate final position with offsets
      const finalPosition = {
        x: position.x - offsetX,
        y: position.y - offsetY
      };
      
      // Generate a thought at the clicked position with offsets
      try {
        console.log(`Trigger: Pane click 🖱️ for node ${activeInputId}`);
        const thought = await createThoughtNodeAtPosition('CLICK', finalPosition, activeInputNode);
        
        if (thought) {
          // Get the current input for this node
          const inputData = getInputData(activeInputId);
          
          // Save the input at the time of click generation
          updateInputBaseline(activeInputId, inputData.currentInput);
        }
      } catch (error) {
        console.error('Error generating thought on pane click:', error);
      }
    },
    [reactFlowInstance, createThoughtNodeAtPosition, getInputData, updateInputBaseline]
  );

  return {
    checkTriggersAndGenerate,
    checkIdleTrigger,
    checkWordCountTrigger,
    checkSentenceEndTrigger,
    checkAstTrigger,
    onPaneClick,
  };
}; 