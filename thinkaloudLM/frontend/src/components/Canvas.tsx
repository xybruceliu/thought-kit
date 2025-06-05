import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  NodeChange,
  applyNodeChanges
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
import MessageContainer from './chat/MessageContainer';
import MessageInput from './chat/MessageInput';
import { deleteThoughtNode, getNodeByThoughtId, markNodeForRemoval } from '../hooks/nodeConnectors';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Augment the Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

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
  const { clearThoughtsOnSubmit } = useSettingsStore();
  const { microphoneEnabled, setMicrophoneEnabled } = useSettingsStore();
  
  // Get chat store data
  const { messages, addUserMessage, isProcessing } = useChatStore();
  
  // Speech recognition state
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use the browser's SpeechRecognition API
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        // Configure the recognition
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        
        // Store the recognition instance
        setRecognition(recognitionInstance);
        
        // Handle cleanup
        return () => {
          recognitionInstance.stop();
        };
      } else {
        console.warn('Speech Recognition API is not supported in this browser');
      }
    }
  }, []);
  
  // Handle microphone click
  const handleMicrophoneClick = useCallback(() => {
    if (!recognition) return;
    
    if (microphoneEnabled) {
      // Stop listening
      recognition.stop();
      setMicrophoneEnabled(false);
    } else {
      // Start listening
      recognition.start();
      
      // Add event listeners
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
          
        // Update the input with the recognized text
        useInputStore.getState().updateInput(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setMicrophoneEnabled(false);
      };
      
      recognition.onend = () => {
        setMicrophoneEnabled(false);
      };
      
      setMicrophoneEnabled(true);
    }
  }, [recognition, microphoneEnabled, setMicrophoneEnabled]);
  
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
  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    
    // Add user message to chat
    addUserMessage(text);
    
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
          
          // AFTER processing the response, clear thoughts if the setting is enabled
          if (clearThoughtsOnSubmit) {
            // Get non-persistent active thoughts
            const nonPersistentThoughts = activeThoughts.filter(t => !t.config.persistent);
            
            // Delete nodes for each non-persistent thought
            nonPersistentThoughts.forEach(thought => {
              const node = getNodeByThoughtId(thought.id);
              if (node) {
                // Mark for removal (for animation)
                markNodeForRemoval(node.id);
                // Delete after animation completes
                setTimeout(() => {
                  deleteThoughtNode(thought.id);
                }, 1000);
              }
            });
          }
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
  }, [addUserMessage, clearThoughtsOnSubmit]);


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
  
        <Settings />
  
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
            onMicrophoneClick={handleMicrophoneClick}
            placeholder="Say anything"
            disabled={isProcessing}
          />
        </Box>
      </>
    );
  }
  
  // Default return for other interface types
  if (interfaceType === 2) {
    return (
      <>
        {/* Split-screen layout */}
        <Box display="flex" width="100%" height="100vh">
          {/* Left side - ReactFlow canvas (larger portion) */}
          <Box flex="2" position="relative" height="100vh">
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onPaneClick={onPaneClick}
              panOnScroll={true}
              minZoom={1}
            >
              <Controls showInteractive={false} />
              <Background gap={12} size={1} color="none" />
            </ReactFlow>
            
            <Settings />
          </Box>
          
          {/* Right side - Chat panel */}
          <Box 
            flex="1" 
            bg="gray.100" 
            height="100vh" 
            display="flex"
            flexDirection="column"
            borderLeft="1px solid"
            borderColor="gray.200"
          >
            {/* Message Container - fills available space */}
            <Box
              flex="1"
              overflow="auto"
              p={4}
            >
              <MessageContainer messages={messages} />
            </Box>
            
            {/* Message input - fixed at bottom */}
            <Box
              position="relative" 
              bottom="35px"
              width="100%"
              maxWidth="450px"
              zIndex={1}
              mx="auto"
            >
              <MessageInput
                onSubmit={handleSendMessage}
                onMicrophoneClick={handleMicrophoneClick}
                placeholder="Say anything"
                disabled={isProcessing}
              />
            </Box>
          </Box>
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
      
      <Settings />
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
