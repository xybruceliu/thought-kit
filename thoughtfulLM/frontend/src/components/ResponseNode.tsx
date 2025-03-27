import React, { useRef, useEffect, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Box, Text, keyframes, usePrefersReducedMotion, IconButton } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useInputNodes } from '../hooks';

type ResponseNodeProps = NodeProps<{
  content: string;
}>;

const ResponseNode: React.FC<ResponseNodeProps> = ({ data, id }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const { addInputNode } = useInputNodes();
  const reactFlowInstance = useReactFlow();
  
  // Define the fade-in animation
  const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
  `;
  
  // Skip animation if user prefers reduced motion
  const animation = prefersReducedMotion
    ? undefined
    : `${fadeIn} 0.5s ease-in`;

  // Word-by-word animation
  useEffect(() => {
    if (prefersReducedMotion || !data.content) {
      // Skip animation for accessibility or if content is empty
      setDisplayedContent(data.content || '');
      return;
    }

    // Filter out any undefined or empty entries
    const words = data.content.split(' ').filter(word => word !== undefined && word !== null);
    let currentWordIndex = 0;
    
    // Reset the displayed content when the actual content changes
    setDisplayedContent('');
    
    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const word = words[currentWordIndex];
        if (word !== undefined && word !== null) {
          setDisplayedContent(prev => 
            prev + (prev ? ' ' : '') + word
          );
        }
        currentWordIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // Adjust speed as needed
    
    return () => clearInterval(typingInterval);
  }, [data.content, prefersReducedMotion]);

  // Auto-resize functionality
  useEffect(() => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;
    
    // Set a minimum height, but allow it to grow as needed
    const newHeight = Math.max(0, contentDiv.scrollHeight);
    contentDiv.style.height = `${newHeight}px`;
  }, [displayedContent]);

  // Handle add button click to start a new input
  const handleAddClick = () => {
    // Get the current node position using the node's id
    const currentNode = reactFlowInstance.getNode(id);
    
    if (currentNode) {
      // Calculate position below this response node
      const newPosition = {
        x: currentNode.position.x,
        y: currentNode.position.y + (currentNode.height || 150) + 50
      };

      console.log('DEBUG: newPosition', newPosition);
      
      // Add a new input node at the calculated position
      addInputNode(newPosition);
    }
  };

  return (
    <Box
      bg="gray.50"
      borderRadius="2xl"
      boxShadow="sm"
      width="500px"
      transition="all 0.2s"
      animation={animation}
    >
      <Box
        ref={contentRef}
        minHeight="0px"
        borderRadius="2xl"
        fontSize="md"
        color="gray.700"
        p={5}
        overflowY="auto"
      >
        <Text whiteSpace="pre-wrap">{displayedContent}</Text>
      </Box>
      <Box position="absolute" bottom="-5" right="3">
        <Box fontSize="2xs" color="gray.400" display="flex" alignItems="center">
          AI's Response
        </Box>
      </Box>
      <Box 
        position="absolute" 
        bottom="-20" 
        left="0">
        <IconButton
          aria-label="New conversation"
          icon={<AddIcon />}
          size="sm"
          boxShadow="sm"
          isRound
          variant="ghost"
          color="gray.500"
          backgroundColor="gray.50"
          onClick={handleAddClick}
          _hover={{
            bg: "gray.100",
            color: "gray.700"
          }}
        />
      </Box>
    </Box>
  );
};

export default ResponseNode; 