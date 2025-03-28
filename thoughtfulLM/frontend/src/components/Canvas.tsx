import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  Edge,
  NodeChange,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import ResponseNode from './ResponseNode';
import BoundaryIndicator from './BoundaryIndicator';
import Settings from './Settings';
import { createInputNode, useTriggerDetection } from '../hooks';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';
import { useInputStore } from '../store/inputStore';
import { useNodeStoreSync, ensureNodesForAllEntities } from '../hooks/nodeStoreSync';

// Define custom node types
const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  thoughtBubble: ThoughtBubbleNode,
  response: ResponseNode,
};

// The inner component that has access to the ReactFlow hooks
const CanvasContent: React.FC = () => {
  // Use the new unified node store instead of individual hooks
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange 
  } = useNodeStore();
  
  // Still use the trigger detection hook for pane clicks
  const { onPaneClick } = useTriggerDetection();
  
  // Use our new unified synchronization hook to keep all nodes in sync with data stores
  useNodeStoreSync();
  
  // Settings state
  const [interfaceType, setInterfaceType] = useState<number>(1);
  const [maxThoughts, setMaxThoughts] = useState<number>(5);

  // Clear all data when the component mounts (page loads/refreshes)
  useEffect(() => {
    const clearDataOnLoad = async () => {
      try {
        // Get the store actions directly from the imported hooks
        const thoughtStore = useThoughtStore.getState();
        const memoryStore = useMemoryStore.getState();
        const nodeStore = useNodeStore.getState();
        const inputStore = useInputStore.getState();
        
        // Clear thoughts, memories and nodes
        thoughtStore.clearThoughts();
        memoryStore.clearMemories();
        nodeStore.clearAllNodes();

        // Create an initial input node
        const position = { x: 250, y: 250 };
        const newNode = createInputNode(position);
        
        // Update position in input store (automatically handled by createInputNode now)
        
        console.log('All data cleared on page refresh');
      } catch (error) {
        console.error('Error clearing data on page load:', error);
      }
    };
    
    // Execute the clear operation
    clearDataOnLoad();
    
    // This effect should only run once when the component mounts
  }, []);

  // Ensure nodes exist for all data entities when component mounts or data changes
  useEffect(() => {
    ensureNodesForAllEntities();
  }, []);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        connectionMode={ConnectionMode.Loose}
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
