import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  Node,
  Edge,
  NodeTypes,
  useReactFlow,
  applyNodeChanges,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@chakra-ui/react';
import TextInputNode from './TextInputNode';
import ThoughtBubbleNode from './ThoughtBubbleNode';
import { generateRandomThought, getRandomInt } from '../utils';

// Define custom node types
const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  thoughtBubble: ThoughtBubbleNode,
};

// The inner component that has access to the ReactFlow hooks
const CanvasContent: React.FC = () => {
  const reactFlowInstance = useReactFlow();
  
  // State for nodes and edges
  const [nodes, setNodes] = useState<Node[]>([
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
      draggable: false, // Prevent dragging the text input node
    },
  ]);
  
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Generate a unique ID for new nodes
  const getId = (): string => {
    return `thought-${Date.now()}`;
  };

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // Handle clicks on the canvas pane
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Get position in the flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Apply offset to position bubbles to the top left of cursor
      // Adjust these values to control how far from cursor the bubble appears
      const offsetX = 80;  // pixels to the left
      const offsetY = 50;  // pixels to the top
      
      // Create a new thought bubble node
      const newNode: Node = {
        id: getId(),
        type: 'thoughtBubble',
        position: {
          x: position.x - offsetX,
          y: position.y - offsetY
        },
        data: {
          content: generateRandomThought(),
          blobVariant: getRandomInt(0, 4), // Random variant between 0-4
        },
        draggable: true, // Explicitly allow dragging thought bubbles
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance]
  );

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
