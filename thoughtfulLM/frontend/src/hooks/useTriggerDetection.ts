import { useCallback, useRef, useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { createThoughtNode, getNodeByEntityId } from './nodeConnectors';
import { NodeData, useNodeStore } from '../store/nodeStore';
import { boundedAreaStrategy, createBoundsAboveNode, setBounds } from '../utils/nodePositioning';

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

    // Create a bounds object for the thought
    const thoughtBounds = createBoundsAboveNode(textInputNode);
    // No need to call setBounds again as createBoundsAboveNode already sets bounds in the store
    const activeThoughtIds = useThoughtStore.getState().activeThoughtIds;
    // use getNodeByEntityId to get the active thoughts
    const activeThoughts = activeThoughtIds
      .map(id => getNodeByEntityId('thought', id))
      .filter((node): node is ReactFlowNode<NodeData> => node !== undefined);
    const thoughtPosition = boundedAreaStrategy.calculateNodePosition(thoughtBounds, activeThoughts);

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
      const offsetX = 75;  // pixels to the left
      const offsetY = 25;  // pixels to the top
      
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
          // If thought id already in node store, do not create a new node
          const existingThought = useNodeStore.getState().nodes.find((n: any) => n.data.thoughtId === thought.id);
          if (existingThought) {
            console.log(`Thought ${thought.id} already exists in node store, not creating a new node`);
          }
          else {
            // Create visualization for the thought
            createThoughtNode(thought, finalPosition);
          }
          
          // Update input baseline any way
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

/**
 * Hook that automatically monitors for trigger conditions on an input
 * and handles debouncing of trigger checks
 * 
 * @param inputId The ID of the input to monitor
 * @param debounceMs The amount of milliseconds to debounce trigger checking
 * @returns An object indicating if trigger detection is currently active
 */
export const useAutomaticTriggerDetection = (
  inputId: string,
  debounceMs: number = 300
) => {
  // Get the base trigger detection functions
  const { checkTriggersAndGenerate } = useTriggerDetection();
  
  // Track the timer for debounced trigger checking
  const triggerTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine if the input is currently active
  const isActive = useInputStore(state => state.activeInputId === inputId);
  
  // Subscribe to input changes
  const inputText = useInputStore(state => {
    const inputData = state.inputs[inputId];
    return inputData ? inputData.currentInput : '';
  });
  
  // Set up effect to check triggers when input changes
  useEffect(() => {
    // Only check triggers if the input is active
    if (!isActive) return;
    
    // Clear any existing timer
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
    }
    
    // Set a debounce timer to avoid excessive checking during rapid typing
    triggerTimerRef.current = setTimeout(() => {
      checkTriggersAndGenerate(inputId);
    }, debounceMs);
    
    // Clean up timer when component unmounts or dependencies change
    return () => {
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
      }
    };
  }, [inputId, inputText, isActive, checkTriggersAndGenerate, debounceMs]);
  
  return {
    isMonitoring: isActive
  };
}; 