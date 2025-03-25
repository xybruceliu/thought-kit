import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  Edge,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import ResponseNode from './ResponseNode';
import { useThoughtNodes, useInputNodes, useResponseNodes } from '../hooks';
import { useTriggerDetection } from '../hooks';
import { thoughtApi } from '../api/thoughtApi';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';

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
  const { responseNodes, onResponseNodesChange } = useResponseNodes();
  const { onPaneClick } = useTriggerDetection();
  
  // Initialize edges state
  const [edges] = useState<Edge[]>([]);

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
    // Determine which nodes are being changed and call the appropriate handler
    onThoughtNodesChange(changes);
    onInputNodesChange(changes);
    onResponseNodesChange(changes);
  }, [onThoughtNodesChange, onInputNodesChange, onResponseNodesChange]);

  return (
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
    </ReactFlow>
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
