import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  Edge,
  NodeChange,
  useReactFlow,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import ResponseNode from './ResponseNode';
import BoundaryIndicator from './BoundaryIndicator';
import Settings from './Settings';
import ReactFlowSynchronizer from './ReactFlowSynchronizer';
import { useThoughtNodes, useInputNodes, useResponseNodes } from '../hooks';
import { useTriggerDetection } from '../hooks';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';

// Define custom node types
const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  thoughtBubble: ThoughtBubbleNode,
  response: ResponseNode,
};

// The inner component that has access to the ReactFlow hooks
const CanvasContent: React.FC = () => {
  // Use our custom hooks for nodes
  const { thoughtNodes, onThoughtNodesChange } = useThoughtNodes();
  const { inputNodes, onInputNodesChange, addInputNode } = useInputNodes();
  const { responseNodes, onResponseNodesChange, setReactFlowInstance } = useResponseNodes();
  const { onPaneClick } = useTriggerDetection();
  const reactFlowInstance = useReactFlow();
  
  // Initialize edges state
  const [edges] = useState<Edge[]>([]);
  
  // Settings state
  const [interfaceType, setInterfaceType] = useState<number>(1);
  const [maxThoughts, setMaxThoughts] = useState<number>(5);

  // Set ReactFlow instance for the response nodes hook
  useEffect(() => {
    if (reactFlowInstance) {
      setReactFlowInstance(reactFlowInstance);
    }
  }, [reactFlowInstance, setReactFlowInstance]);

  // Combine all nodes for the canvas
  const nodes = useMemo(() => {
    return [...inputNodes, ...thoughtNodes, ...responseNodes];
  }, [inputNodes, thoughtNodes, responseNodes]);

  // Clear all data when the component mounts (page loads/refreshes)
  useEffect(() => {
    const clearDataOnLoad = async () => {
      try {
        // Get the store actions directly from the imported hooks
        const thoughtStore = useThoughtStore.getState();
        const memoryStore = useMemoryStore.getState();
        
        // Clear thoughts and memories
        thoughtStore.clearThoughts();
        memoryStore.clearMemories();
        
        console.log('All data cleared on page refresh');
      } catch (error) {
        console.error('Error clearing data on page load:', error);
      }
    };
    
    // Execute the clear operation
    clearDataOnLoad();
    
    // This effect should only run once when the component mounts
  }, []);

  // Combined nodes change handler
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter changes by node type based on ID prefix
    const thoughtChanges = changes.filter(change => 
      'id' in change && !change.id.startsWith('input-') && !change.id.startsWith('response-')
    );
    
    const inputChanges = changes.filter(change => 
      'id' in change && change.id.startsWith('input-')
    );
    
    const responseChanges = changes.filter(change => 
      'id' in change && change.id.startsWith('response-')
    );
    
    // Only pass relevant changes to each handler
    if (thoughtChanges.length > 0) onThoughtNodesChange(thoughtChanges);
    if (inputChanges.length > 0) onInputNodesChange(inputChanges);
    if (responseChanges.length > 0) onResponseNodesChange(responseChanges);
  }, [onThoughtNodesChange, onInputNodesChange, onResponseNodesChange]);

  // Handlers for settings changes
  const handleInterfaceChange = useCallback((interfaceType: number) => {
    setInterfaceType(interfaceType);
    // Additional logic to change interface can be added here
    console.log(`Interface changed to: ${interfaceType}`);
  }, []);

  const handleMaxThoughtsChange = useCallback((max: number) => {
    setMaxThoughts(max);
    // Update the max thought count in the thought store
    useThoughtStore.setState({ maxThoughtCount: max });
    console.log(`Max thoughts set to: ${max}`);
  }, []);

  // Web Speech API implementation placeholder
  const handleMicrophoneClick = useCallback(() => {
    console.log('Microphone clicked - Web Speech API to be implemented');
    // Toggle microphone state in settings
    const { microphoneEnabled, setMicrophoneEnabled } = useSettingsStore.getState();
    setMicrophoneEnabled(!microphoneEnabled);
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{
          padding: 0.5,
          minZoom: 1,
          maxZoom: 1.5
        }}
      >
        <Controls showInteractive={false} />
        <Background gap={12} size={1} color="none" />
        <BoundaryIndicator />
        <ReactFlowSynchronizer />
      </ReactFlow>
      <Settings onMicrophoneClick={handleMicrophoneClick} />
    </>
  );
};

// The main Canvas component wraps CanvasContent with ReactFlowProvider
const Canvas: React.FC = () => {
  return (
    <Box width="100%" height="100vh" bg="gray.100">
      <ReactFlowProvider>
        <CanvasContent />
      </ReactFlowProvider>
    </Box>
  );
};

export default Canvas; 
