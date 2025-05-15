import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Button, Input, Textarea } from '@chakra-ui/react';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import BoundaryIndicator from './BoundaryIndicator';
import Settings from './Settings';
import AppInfo from './AppInfo';
import { useTriggerDetection } from '../hooks';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useInputStore } from '../store/inputStore';
import { useChatStore } from '../store/chatStore';
import { MessageInput, MessageContainer } from './chat';
// Define custom node types
const nodeTypes: NodeTypes = {
  thoughtBubble: ThoughtBubbleNode,
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
  
  // Get chat store data
  const { messages, addUserMessage, isProcessing } = useChatStore();
  
  // Initialize the application when the component mounts or interface type changes
  useEffect(() => {
    console.log(`Initializing application for interface type ${interfaceType}...`);
    
    // Get the store actions directly
    const thoughtStore = useThoughtStore.getState();
    const memoryStore = useMemoryStore.getState();
    const nodeStore = useNodeStore.getState();
    const inputStore = useInputStore.getState();
    const chatStore = useChatStore.getState();
    
    // Clear all existing data
    thoughtStore.clearThoughts();
    memoryStore.clearMemories();
    nodeStore.clearAllNodes();
    inputStore.clearInput();
    chatStore.clearMessages();
    
    console.log('Application initialized successfully');
  }, [interfaceType]);
  
  // Get thoughts to monitor for changes
  const thoughts = useThoughtStore(state => state.thoughts);

  // Handle message submission for the chat interface
  const handleSendMessage = useCallback((message: string) => {
    console.log('Message sent:', message);
    // Add the message to the chat store
    addUserMessage(message);
    
    // Set processing state to true to show loading indicator
    useChatStore.getState().setIsProcessing(true);
    
    // Use the existing handleThoughtsSubmit method from thoughtStore
    useThoughtStore.getState().handleThoughtsSubmit()
      .then((response) => {
        if (response) {
          // Get the active thought IDs from the thought store
          const activeThoughts = useThoughtStore.getState().getActiveThoughts();
          const activeThoughtIds = activeThoughts.map(thought => thought.id);
          
          // Add the AI response to the chat with related thought IDs
          useChatStore.getState().addAIResponse(response, activeThoughtIds);
        } else {
          // Handle case where response is null
          console.error('No response from handleThoughtsSubmit');
        }
      })
      .catch(() => {
        // Add a fallback response if there's an error
        console.error('Error getting AI response');
      });
    
    // Input is already being tracked by the input store through the MessageInput component
  }, [addUserMessage]);


  if (interfaceType === 1) {
    return (
      <>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onPaneClick={onPaneClick}
          panOnScroll={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
        >
          <Controls showInteractive={false} />
          <Background gap={12} size={1} color="none" />
          <BoundaryIndicator />
        </ReactFlow>
  
        <Settings onMicrophoneClick={() => {}} />
  
        {/* Message Container */}
        <Box
          position="absolute" 
          top="35px"
          width="100%"
          maxWidth="600px"
          maxHeight="50%"
          zIndex={1}
          mx="auto"
          left="50%"
          transform="translateX(-50%)"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <MessageContainer messages={messages} />
        </Box>
        
        {/* Message input */}
        <Box
          position="absolute" 
          bottom="35px"
          width="100%"
          maxWidth="600px"
          zIndex={1}
          mx="auto"
          left="50%"
          transform="translateX(-50%)"
        >
          <MessageInput
            onSubmit={handleSendMessage}
            placeholder="Say anything"
            disabled={isProcessing}
          />
        </Box>
      </>
    );
  }
  
  // Default return for other interface types
  return (
    <>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onPaneClick={onPaneClick}
        panOnScroll={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Controls showInteractive={false} />
        <Background gap={12} size={1} color="none" />
        <BoundaryIndicator />
      </ReactFlow>
      
      <Settings onMicrophoneClick={() => {}} />
    </>
  );
};

// The main Canvas component wraps CanvasContent with ReactFlowProvider
const Canvas: React.FC = () => {
  return (
    <Box 
      width="100%" 
      height="100vh" 
      bg="gray.100"
    >
      <ReactFlowProvider>
        <CanvasContent />
        <AppInfo />
      </ReactFlowProvider>
    </Box>
  );
};

export default Canvas; 
