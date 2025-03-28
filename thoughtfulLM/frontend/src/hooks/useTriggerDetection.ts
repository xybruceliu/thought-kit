import { useCallback } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { createThoughtNode } from './nodeConnectors';

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

  // Create a thought node at the specified position
  const createThoughtNodeAtPosition = useCallback(async (
    triggerType: 'CLICK' | 'IDLE_TIME' | 'WORD_COUNT_CHANGE' | 'SENTENCE_END' | 'NAMED_ENTITY',
    position?: { x: number, y: number },
    sourceNode?: ReactFlowNode
  ) => {
    try {
      // Get thought position from parameters or calculate relative to source node
      const thoughtPosition = position || (sourceNode ? {
        x: sourceNode.position.x + 250,
        y: sourceNode.position.y - 50
      } : { x: 100, y: 100 });
      
      // Generate the thought using the thought store
      const thought = await useThoughtStore.getState().generateThought(triggerType, thoughtPosition);
      
      if (thought) {
        // Create a node for the thought using our new createThoughtNode function
        createThoughtNode(thought, thoughtPosition);
        return thought;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating thought node:', error);
      return null;
    }
  }, []);

  // Function to check all triggers and generate thoughts
  const checkTriggersAndGenerate = useCallback(async (textInputNode: ReactFlowNode, nodeId: string) => {
    let thoughtGenerated = false;
    
    // Get input data for this specific node
    const inputData = inputStore.getInputData(nodeId);
    
    // Save the current input at the time we check triggers
    const inputAtCheckTime = inputData.currentInput;
    
    // Check for sentence end trigger
    if (checkSentenceEndTrigger(nodeId)) {
      // Update the input baseline BEFORE generating a thought
      inputStore.updateInputBaseline(nodeId, inputAtCheckTime);

      const thought = await createThoughtNodeAtPosition('SENTENCE_END', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for word count trigger
    else if (checkWordCountTrigger(nodeId)) {
      inputStore.updateInputBaseline(nodeId, inputAtCheckTime);
      
      const thought = await createThoughtNodeAtPosition('WORD_COUNT_CHANGE', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for idle trigger
    else if (checkIdleTrigger(nodeId)) {
      // Set the idle trigger fired state to true BEFORE generating a thought to prevent repeat triggers
      inputStore.setIdleTriggerFired(nodeId, true);
      inputStore.updateInputBaseline(nodeId, inputAtCheckTime);

      const thought = await createThoughtNodeAtPosition('IDLE_TIME', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;
      }
    }
    // Check for test trigger
    else if (checkAstTrigger(nodeId)) {
      inputStore.updateInputBaseline(nodeId, inputAtCheckTime);
      const thought = await createThoughtNodeAtPosition('NAMED_ENTITY', undefined, textInputNode);
      if (thought) {
        thoughtGenerated = true;    
      }
    }
    
    // Update activity timestamp if a thought was generated
    if (thoughtGenerated) {
      inputStore.updateActivityTimestamp(nodeId);
      return true;
    }
    
    return false;
  }, [
    checkSentenceEndTrigger, 
    checkWordCountTrigger, 
    checkIdleTrigger, 
    checkAstTrigger, 
    createThoughtNodeAtPosition, 
    inputStore
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
          const inputData = inputStore.getInputData(activeInputId);
          
          // Save the input at the time of click generation
          inputStore.updateInputBaseline(activeInputId, inputData.currentInput);
        }
      } catch (error) {
        console.error('Error generating thought from click:', error);
      }
    },
    [reactFlowInstance, createThoughtNodeAtPosition, inputStore]
  );

  return {
    onPaneClick,
    checkTriggersAndGenerate,
    createThoughtNodeAtPosition
  };
}; 