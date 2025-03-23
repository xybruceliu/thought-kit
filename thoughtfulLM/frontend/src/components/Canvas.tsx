import React, { useState } from 'react';
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
