import React, { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  Node,
  Edge,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';

// Define custom node types
const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
};

const Canvas: React.FC = () => {
  // Create the initial node at position (0,0) and let React Flow center it
  const [nodes] = useState<Node[]>([
    {
      id: 'input-1',
      type: 'textInput',
      position: { x: 0, y: 0 },
      data: { 
        value: '', 
        onChange: (value: string) => {
          console.log('Input changed:', value);
        } 
      },
    },
  ]);
  
  const [edges] = useState<Edge[]>([]);

  return (
    <Box width="100%" height="100vh" bg="gray.100">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
      </ReactFlowProvider>
    </Box>
  );
};

export default Canvas; 
