import { useState, useCallback, useEffect } from 'react';
import { Node, NodeChange, applyNodeChanges, XYPosition } from 'reactflow';
import { useInputStore } from '../store/inputStore';
import { useTriggerDetection } from './useTriggerDetection';
import { v4 as uuidv4 } from 'uuid';

// Type for input nodes
export interface InputNode extends Node {
  id: string;
  type: 'textInput';
  position: XYPosition;
  data: {
    value?: string;
  };
  draggable: boolean;
}

/**
 * Custom hook that manages input nodes and their text input functionality
 * Combines node management with input text handling
 */
export const useInputNodes = () => {
  // Get input store methods
  const {
    getInputData,
    updateInput,
    addInputNode: registerInputInStore,
    setActiveInputId,
    activeInputId
  } = useInputStore();

  // Get trigger detection functionality
  const { checkTriggersAndGenerate } = useTriggerDetection();
  
  // State for input nodes
  const [inputNodes, setInputNodes] = useState<InputNode[]>([]);
  const [currentNodeRefs, setCurrentNodeRefs] = useState<Record<string, Node | null>>({});
  
  // Create a new input node at the specified position
  const createInputNodeAtPosition = useCallback((position: XYPosition): InputNode => {
    const nodeId = `input-${uuidv4().substring(0, 8)}`;
    
    // Register this input with the input store
    registerInputInStore(nodeId);
    
    return {
      id: nodeId,
      type: 'textInput',
      position,
      data: { 
        value: '', 
      },
      draggable: false,
    };
  }, [registerInputInStore]);
  
  // Add a new input node to the canvas
  const addInputNode = useCallback((position: XYPosition = { x: 0, y: 0 }) => {
    const newNode = createInputNodeAtPosition(position);
    
    setInputNodes(prevInputNodes => [...prevInputNodes, newNode]);
    
    // Set as active input
    setActiveInputId(newNode.id);
    
    // Return the created node ID so it can be used if needed
    return newNode.id;
  }, [createInputNodeAtPosition, setActiveInputId]);
  
  // Remove an input node from the canvas
  const removeInputNode = useCallback((nodeId: string) => {
    // Don't remove if it's the only input node
    if (inputNodes.length <= 1) {
      return false;
    }
    
    // Remove from input store
    useInputStore.getState().removeInputNode(nodeId);
    
    // Remove from our local state
    setInputNodes(prevInputNodes => 
      prevInputNodes.filter(node => node.id !== nodeId)
    );
    
    // Remove from current node refs
    setCurrentNodeRefs(prev => {
      const updated = { ...prev };
      delete updated[nodeId];
      return updated;
    });
    
    return true;
  }, [inputNodes.length]);
  
  // Initialize with a single input node if none exists
  useEffect(() => {
    if (inputNodes.length === 0) {
      // Create first input node at default position
      addInputNode({ x: 50, y: 50 });
    }
  }, [addInputNode, inputNodes.length]);
  
  // Handle node changes including position updates
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply position changes to our input nodes
      setInputNodes(prevNodes => 
        applyNodeChanges(
          // Only apply changes to input nodes - filter without direct id checks
          changes.filter(change => {
            // For each change, check if it affects our input nodes
            if ('id' in change) {
              // It's a change with an ID property (position, remove, select)
              return prevNodes.some(node => node.id === change.id);
            }
            return false; // Ignore other types of changes
          }), 
          prevNodes
        ) as InputNode[]
      );
    },
    []
  );
  
  // Handle text changes for a specific input node
  const handleTextChange = useCallback((nodeId: string, inputText: string, textInputNode?: Node) => {
    if (!nodeId) return;
    
    // Set this as the active input
    setActiveInputId(nodeId);
    
    // Update global state for this specific input
    updateInput(nodeId, inputText);
    
    // Store the node reference
    if (textInputNode) {
      setCurrentNodeRefs(prev => ({
        ...prev,
        [nodeId]: textInputNode
      }));
      
      // Check all triggers after updating input
      checkTriggersAndGenerate(textInputNode, nodeId).catch(error => {
        console.error('Error during trigger detection:', error);
      });
    }
  }, [setActiveInputId, updateInput, checkTriggersAndGenerate]);
  
  // Check for idle trigger periodically for all input nodes
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      // Check each input node for idle triggers
      Object.entries(currentNodeRefs).forEach(([nodeId, node]) => {
        if (node) {
          const inputData = getInputData(nodeId);
          if (inputData.currentInput.trim()) {
            checkTriggersAndGenerate(node, nodeId).catch(error => {
              console.error('Error during idle trigger detection:', error);
            });
          }
        }
      });
    }, 1000); // Check every second
    
    return () => clearInterval(idleCheckInterval);
  }, [currentNodeRefs, getInputData, checkTriggersAndGenerate]);
  
  // Get text value for a specific node
  const getInputText = useCallback((nodeId: string) => {
    const inputData = getInputData(nodeId);
    return inputData.currentInput;
  }, [getInputData]);

  return {
    inputNodes,
    onInputNodesChange: onNodesChange,
    addInputNode,
    removeInputNode,
    handleTextChange,
    getInputText,
    activeInputId
  };
}; 