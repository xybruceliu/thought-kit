import { useCallback, useRef, useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { Node as ReactFlowNode, useReactFlow } from 'reactflow';
import { createThoughtNode, generateAndCreateThoughtNode } from './nodeConnectors';
import { NodeData } from '../store/nodeStore';
import { boundedAreaStrategy, createBoundsAboveNode } from '../utils/nodePositioning';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';

// Interface for input data that will be used by the trigger detection
export interface InputTriggerData {
  currentInput: string;
  newInput?: string;
  lastActivityTimestamp: number;
  idleTriggerFired?: boolean;
}

/**
 * Custom hook that handles thought trigger detection for chat interface
 */
export const useTriggerDetection = () => {
  const reactFlowInstance = useReactFlow();
  
  // Get settings from the input store
  const idleTimeThreshold = useInputStore(state => state.idleTimeThreshold);
  const wordCountChangeThreshold = useInputStore(state => state.wordCountChangeThreshold);
  const sentenceWordThreshold = useInputStore(state => state.sentenceWordThreshold);

  // Check if idle time trigger condition is met
  const checkIdleTrigger = useCallback((inputData: InputTriggerData) => {
    // Only trigger if we haven't already fired an idle trigger and there is input text
    if (inputData.idleTriggerFired || !inputData.newInput) {
      return false;
    }

    // if new input length is smaller than 3 characters, don't trigger idle trigger
    if (inputData.newInput.length < 3) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastActivity = now - inputData.lastActivityTimestamp;
    
    if (timeSinceLastActivity > idleTimeThreshold) {
      console.log(`Trigger: Idle time > ${idleTimeThreshold}ms ⏱️`);
      
      // Set the idle trigger as fired in the input store
      useInputStore.getState().setIdleTriggerFired(true);
      
      return true;
    }
    return false;
  }, [idleTimeThreshold]);
  
  // Check if word count change trigger condition is met
  const checkWordCountTrigger = useCallback((inputData: InputTriggerData) => {
    // Skip if there's no new input
    if (!inputData.newInput) return false;
    
    // Use newInput word count for trigger
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    // Only trigger when new word count has reached the threshold and the last character is a " " to make sure user finished typing a word
    if (newWordCount >= wordCountChangeThreshold && inputData.newInput.slice(-1) === " ") {
      console.log(`Trigger: Word count increase > ${wordCountChangeThreshold} ✍️`);
      return true;
    }
    return false;
  }, [wordCountChangeThreshold]);

  // Check if sentence end trigger condition is met
  const checkSentenceEndTrigger = useCallback((inputData: InputTriggerData) => {
    // Skip if there's no new input
    if (!inputData.newInput) return false;
    
    // Check if the last character of the new input is a sentence-ending punctuation
    const lastChar = inputData.newInput.trim().slice(-1);
    const isPunctuation = ['.', '!', '?'].includes(lastChar);
    
    if (!isPunctuation) return false;
    
    // Use newInput word count for sentence trigger
    const newWordCount = inputData.newInput.split(/\s+/).filter(Boolean).length;
    if (newWordCount >= sentenceWordThreshold) {
      console.log(`Trigger: Sentence end > ${sentenceWordThreshold} words 💬`);
      return true;
    }
    return false;
  }, [sentenceWordThreshold]);

  // Function that checks all triggers and returns the activated trigger type and relevant data
  const checkTriggers = useCallback((inputData: InputTriggerData): { 
    triggerType: 'SENTENCE_END' | 'WORD_COUNT_CHANGE' | 'IDLE_TIME' | 'CLICK' | null;
    inputAtCheckTime: string;
  } => {
    // Save the current input at the time we check triggers
    const inputAtCheckTime = inputData.currentInput;
    
    // Check each trigger in priority order
    if (checkSentenceEndTrigger(inputData)) {
      return { triggerType: 'SENTENCE_END', inputAtCheckTime };
    }
    else if (checkWordCountTrigger(inputData)) {
      return { triggerType: 'WORD_COUNT_CHANGE', inputAtCheckTime };
    }
    else if (checkIdleTrigger(inputData)) {
      return { triggerType: 'IDLE_TIME', inputAtCheckTime };
    }
    
    // No trigger activated
    return { triggerType: null, inputAtCheckTime };
  }, [
    checkSentenceEndTrigger,
    checkWordCountTrigger,
    checkIdleTrigger
  ]);
  
  // Function to generate thought based on input
  const generateThoughtFromInput = useCallback(async (
    triggerType: 'SENTENCE_END' | 'WORD_COUNT_CHANGE' | 'IDLE_TIME' | 'CLICK',
    inputText: string
  ): Promise<boolean> => {
    // Get existing nodes from the node store
    const existingNodes = useNodeStore.getState().nodes;
    
    // Find the message input element
    const messageInputElement = document.getElementById('message-input'); 
    
    let position;
    
    if (messageInputElement) {
      // Create bounds above the message input
      const bounds = createBoundsAboveNode(messageInputElement as HTMLElement);
      
      // Use the bounded area strategy to get a position within these bounds
      // Pass in the existing nodes so the strategy can avoid overlaps
      position = boundedAreaStrategy.calculateNodePosition(
        bounds, 
        existingNodes, 
        'bottom' // Prefer positioning at the bottom
      );
    } else {
      // Fallback to top left of canvas
      console.log('No message input element found, falling back to top left of canvas');
      position = reactFlowInstance.screenToFlowPosition({
        x: 0,
        y: 0
      });
    }
    
    try {
      // Use the combined function to generate thought and create node in one step
      const node = await generateAndCreateThoughtNode(triggerType, position);
      return node !== null;
    } catch (error) {
      console.error('Error generating thought:', error);
      return false;
    }
  }, [reactFlowInstance]);
  
  // Handle clicks on the pane to generate thoughts
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
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
        console.log('Trigger: Pane click 🖱️');
        
        // Use the combined function to generate thought and create node
        await generateAndCreateThoughtNode('CLICK', finalPosition);
      } catch (error) {
        console.error('Error generating thought from click:', error);
      }
    },
    [reactFlowInstance]
  );

  return {
    onPaneClick,
    checkTriggers,
    generateThoughtFromInput
  };
};

/**
 * Hook for automatically detecting trigger conditions in a chat message
 * Uses the simplified inputStore directly
 * 
 * @param onTrigger Optional callback when a trigger is activated
 * @param debounceMs Debounce time in milliseconds
 * @returns Object with monitoring status
 */
export const useAutomaticTriggerDetection = (
  onTrigger?: (triggerType: string) => void,
  debounceMs: number = 300
) => {
  // Get the trigger detection functions
  const { checkTriggers, generateThoughtFromInput } = useTriggerDetection();
  
  // Get input data directly from the store
  const inputData = useInputStore(state => state.inputData);
  
  // Track the timer for debounced trigger checking
  const triggerTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track previous input to detect changes
  const prevInputRef = useRef(inputData.currentInput);
  
  // Set up effect to check triggers when input changes
  useEffect(() => {
    // Skip if input hasn't changed
    if (prevInputRef.current === inputData.currentInput) {
      return;
    }
    
    // Update previous input reference
    prevInputRef.current = inputData.currentInput;
    
    // Clear any existing timer
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
    }
    
    // Set a debounce timer to avoid excessive checking during rapid typing
    triggerTimerRef.current = setTimeout(() => {
      // Check for triggers
      const { triggerType, inputAtCheckTime } = checkTriggers(inputData);
      
      // Generate thought if trigger activated
      if (triggerType) {
        generateThoughtFromInput(triggerType, inputAtCheckTime);
        
        // Call the onTrigger callback if provided
        if (onTrigger) {
          onTrigger(triggerType);
        }
        
        // Update the input baseline in the store after generating a thought
        useInputStore.getState().updateInputBaseline(inputData.currentInput);
      }
    }, debounceMs);
    
    // Clean up timer when component unmounts or dependencies change
    return () => {
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
      }
    };
  }, [inputData, checkTriggers, generateThoughtFromInput, onTrigger, debounceMs]);
  
  // Set up a separate interval specifically for checking idle time
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      // Only check for idle trigger if there's input and the idle trigger hasn't fired yet
      if (inputData.currentInput.trim() && !inputData.idleTriggerFired) {
        const { triggerType, inputAtCheckTime } = checkTriggers(inputData);
        
        if (triggerType === 'IDLE_TIME') {
          generateThoughtFromInput(triggerType, inputAtCheckTime);
          
          if (onTrigger) {
            onTrigger(triggerType);
          }
          
          useInputStore.getState().updateInputBaseline(inputData.currentInput);
        }
      }
    }, 1000); // Check every second
    
    return () => {
      clearInterval(idleCheckInterval);
    };
  }, [inputData, checkTriggers, generateThoughtFromInput, onTrigger]);
  
  return {
    isMonitoring: true
  };
}; 