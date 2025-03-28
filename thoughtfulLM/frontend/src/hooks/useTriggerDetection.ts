import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { createThoughtNode, getNodeByEntityId } from './nodeConnectors';

/**
 * Custom hook that handles thought trigger detection logic
 * Separates trigger detection concerns from the thought store
 */
export const useTriggerDetection = () => {
  const reactFlowInstance = useReactFlow();
  
  // Access input store functions directly
  const inputStore = useInputStore(state => ({
    getInputData: state.getInputData,
    idleTimeThreshold: state.idleTimeThreshold,
    wordCountChangeThreshold: state.wordCountChangeThreshold,
    sentenceWordThreshold: state.sentenceWordThreshold,
    updateInputBaseline: state.updateInputBaseline,
    updateActivityTimestamp: state.updateActivityTimestamp,
    setIdleTriggerFired: state.setIdleTriggerFired
  }));

  // Check if idle time trigger condition is met
  const checkIdleTrigger = useCallback((nodeId: string) => {
    const inputData = inputStore.getInputData(nodeId);
    
    // Only trigger if we haven't already fired an idle trigger and there is input text
    if (inputData.idleTriggerFired || !inputData.currentInput.trim()) {
      return false;
    }
    
    const now = Date.now();
    if ((now - inputData.lastActivityTimestamp) > inputStore.idleTimeThreshold) {
      console.log(`Trigger: Idle time > ${inputStore.idleTimeThreshold}ms ⏱️ for node ${nodeId}`);
      return true;
    }
    return false;
  }, [inputStore]);
  
  // Check if word count change trigger condition is met
  const checkWordCountTrigger = useCallback((nodeId: string) => {
    const inputData = inputStore.getInputData(nodeId);
    
    // Use newInput instead of calculating difference from currentInput
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when new word count has reached the threshold and the last character is a " " to make sure user finished typing a word
    if (newWordCount >= inputStore.wordCountChangeThreshold && inputData.newInput.slice(-1) === " ") {
      console.log(`Trigger: Word count increase > ${inputStore.wordCountChangeThreshold} ✍️ for node ${nodeId}`);
      return true;
    }
    return false;
  }, [inputStore]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback((nodeId: string) => {
    const inputData = inputStore.getInputData(nodeId);
    
    // Check if the last character of the new input or current input is a sentence-ending punctuation
    const lastChar = inputData.newInput.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Use newInput word count for sentence trigger
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    if (newWordCount >= inputStore.sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${inputStore.sentenceWordThreshold} words 💬 for node ${nodeId}`);
      return true;
    }
    return false;
  }, [inputStore]);


  // TESTING: Check if user has typed "*". This is only for testing purposes
  const checkAstTrigger = useCallback((nodeId: string) => {
    const inputData = inputStore.getInputData(nodeId);
    
    if (inputData.currentInput.includes('*')) {
      console.log(`TESTING Trigger: User typed "*" 🔍 for node ${nodeId}`);
      return true;
    }
    return false;
  }, [inputStore]);

  // Function that checks all triggers and returns the activated trigger type and relevant data
  const checkTriggers = useCallback((nodeId: string): { 
    triggerType: 'SENTENCE_END' | 'WORD_COUNT_CHANGE' | 'IDLE_TIME' | 'NAMED_ENTITY' | null;
    inputAtCheckTime: string;
  } => {
    // Get input data for this specific node
    const inputData = inputStore.getInputData(nodeId);
    
    // Save the current input at the time we check triggers
    const inputAtCheckTime = inputData.currentInput;
    
    // Check each trigger in priority order
    if (checkSentenceEndTrigger(nodeId)) {
      return { triggerType: 'SENTENCE_END', inputAtCheckTime };
    }
    else if (checkWordCountTrigger(nodeId)) {
      return { triggerType: 'WORD_COUNT_CHANGE', inputAtCheckTime };
    }
    else if (checkIdleTrigger(nodeId)) {
      // Set the idle trigger fired state to true for idle triggers
      inputStore.setIdleTriggerFired(nodeId, true);
      return { triggerType: 'IDLE_TIME', inputAtCheckTime };
    }
    else if (checkAstTrigger(nodeId)) {
      return { triggerType: 'NAMED_ENTITY', inputAtCheckTime };
    }
    
    // No trigger activated
    return { triggerType: null, inputAtCheckTime };
  }, [
    checkSentenceEndTrigger,
    checkWordCountTrigger,
    checkIdleTrigger,
    checkAstTrigger,
    inputStore
  ]);
  
  // Function that handles thought generation and node creation based on trigger type
  const handleTriggerActivation = useCallback(async (
    nodeId: string,
    triggerType: 'SENTENCE_END' | 'WORD_COUNT_CHANGE' | 'IDLE_TIME' | 'NAMED_ENTITY',
    inputAtCheckTime: string
  ): Promise<boolean> => {
    // Get the node using our connector function
    const textInputNode = getNodeByEntityId('input', nodeId);
    if (!textInputNode) {
      console.warn(`Could not find input node with ID ${nodeId}`);
      return false;
    }
    
    // Update input baseline
    inputStore.updateInputBaseline(nodeId, inputAtCheckTime);
    
    // Calculate position relative to the input node
    const thoughtPosition = {
      x: textInputNode.position.x + 250,
      y: textInputNode.position.y - 50
    };
    
    // Generate the thought
    const thought = await useThoughtStore.getState().generateThought(triggerType, thoughtPosition);
    
    if (thought) {
      // Create visualization for the thought
      createThoughtNode(thought, thoughtPosition);
      
      // Update activity timestamp
      inputStore.updateActivityTimestamp(nodeId);
      return true;
    }
    
    return false;
  }, [
    getNodeByEntityId,
    inputStore
  ]);
  
  // Function that checks triggers and generates thoughts using the separated functions
  const checkTriggersAndGenerate = useCallback(async (nodeId: string): Promise<boolean> => {
    // Get the trigger information
    const { triggerType, inputAtCheckTime } = checkTriggers(nodeId);
    
    // If no trigger is activated, return false
    if (!triggerType) {
      return false;
    }
    
    // Handle the trigger by generating thought and creating node
    return handleTriggerActivation(nodeId, triggerType, inputAtCheckTime);
  }, [
    checkTriggers,
    handleTriggerActivation
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

      const activeInputNode = getNodeByEntityId('input', activeInputId);
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
        
        // Generate the thought
        const thought = await useThoughtStore.getState().generateThought('CLICK', finalPosition);
        
        if (thought) {
          // Create visualization for the thought
          createThoughtNode(thought, finalPosition);
          
          // Get the current input for this node
          const inputData = inputStore.getInputData(activeInputId);
          
          // Save the input at the time of click generation
          inputStore.updateInputBaseline(activeInputId, inputData.currentInput);
        }
      } catch (error) {
        console.error('Error generating thought from click:', error);
      }
    },
    [reactFlowInstance, inputStore]
  );

  return {
    onPaneClick,
    checkTriggersAndGenerate
  };
}; 