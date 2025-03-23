import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  NodeTypes,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import { useThoughtNodes } from '../hooks';
import { useTriggerDetection } from '../hooks';
import { thoughtApi } from '../api/thoughtApi';

// Define custom node types
const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  thoughtBubble: ThoughtBubbleNode,
};

// The inner component that has access to the ReactFlow hooks
const CanvasContent: React.FC = () => {
  // Use our custom hooks
  const { nodes, onNodesChange } = useThoughtNodes();
  const { onPaneClick } = useTriggerDetection();
  
  // Initialize edges state
  const [edges] = useState<Edge[]>([]);

  // Clear all data when the component mounts (page loads/refreshes)
  useEffect(() => {
    const clearDataOnLoad = async () => {
      try {
        // Clear both thoughts and memories
        await thoughtApi.clearAllData();
        console.log('All data cleared on page refresh');
      } catch (error) {
        console.error('Error clearing data on page load:', error);
      }
    };
    
    // Execute the clear operation
    clearDataOnLoad();
    
    // This effect should only run once when the component mounts
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
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
      <Background gap={12} size={1} color="#f0f0f0" />
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
