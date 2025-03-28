import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import ResponseNode from './ResponseNode';
import BoundaryIndicator from './BoundaryIndicator';
import Settings from './Settings';
import { useTriggerDetection, useAppInitialization } from '../hooks';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';

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
    onNodesChange 
  } = useNodeStore();
  
  // Use the trigger detection hook for pane clicks
  const { onPaneClick } = useTriggerDetection();
  
  // Get current interface type from settings store
  const interfaceType = useSettingsStore(state => state.interfaceType);
  
  // Initialize the application with default settings
  // This will respond to interface type changes
  useAppInitialization();
  
  // Get thoughts to monitor for changes
  const thoughts = useThoughtStore(state => state.thoughts);

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
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
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
