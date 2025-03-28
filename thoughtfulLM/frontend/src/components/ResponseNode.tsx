import React, { useRef, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { Box, Text, keyframes, usePrefersReducedMotion } from '@chakra-ui/react';
import { ResponseNodeData } from '../store/nodeStore';

// Update to use our unified node data type
type ResponseNodeProps = NodeProps<ResponseNodeData>;

const ResponseNode: React.FC<ResponseNodeProps> = ({ data }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedContent, setDisplayedContent] = useState<string>('');
  
  // Get the response text from the node data
  const content = data.responseText || '';
  
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
    if (prefersReducedMotion || !content) {
      // Skip animation for accessibility or if content is empty
      setDisplayedContent(content || '');
      return;
    }

    // Filter out any undefined or empty entries
    const words = content.split(' ').filter(word => word !== undefined && word !== null);
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
  }, [content, prefersReducedMotion]);

  // Auto-resize functionality
  useEffect(() => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;
    
    // Set a minimum height, but allow it to grow as needed
    const newHeight = Math.max(0, contentDiv.scrollHeight);
    contentDiv.style.height = `${newHeight}px`;
  }, [displayedContent]);

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
    </Box>
  );
};

export default ResponseNode; 