import React, { useRef, useEffect, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Box, IconButton, Text, keyframes } from '@chakra-ui/react';
import { ResponseNodeData } from '../store/nodeStore';
import { AddIcon } from '@chakra-ui/icons';
import { createInputNode, getNodeById, getNodesByType } from '../hooks/';
import { useSettingsStore } from '../store/settingsStore';

// Update to use our unified node data type
type ResponseNodeProps = NodeProps<ResponseNodeData>;

const ResponseNode: React.FC<ResponseNodeProps> = (props) => {
  const { data, id } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [showAddButton, setShowAddButton] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [buttonFadingOut, setButtonFadingOut] = useState<boolean>(false);
  const reactFlowInstance = useReactFlow();
  
  // Get the response text from the node data
  const content = data.responseText || '';
  
  // Define the fade-in animation for response node
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  // Define the fade-in animation for add button
  const buttonFadeIn = keyframes`
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  `;
  
  // Define the fade-out animation for add button
  const buttonFadeOut = keyframes`
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.8); }
  `;
  
  // Animation definitions
  const buttonAnimation = buttonFadingOut 
    ? `${buttonFadeOut} 0.3s ease-out forwards`
    : `${buttonFadeIn} 0.5s ease-in`;

  // Force every response node to start invisible and fade in
  // This ensures consistent animation regardless of how the node is created
  useEffect(() => {
    // Start with the node invisible
    setIsVisible(false);
    
    // Short delay to ensure fade-in animation is visible
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(showTimer);
  }, [id]); // Re-trigger if ID changes (shouldn't happen, but for safety)

  // Word-by-word animation
  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      return;
    }

    // Filter out any undefined or empty entries
    const words = content.split(' ').filter(Boolean);
    let currentWordIndex = 0;
    
    // Reset the displayed content when the actual content changes
    setDisplayedContent('');
    
    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const word = words[currentWordIndex];
        setDisplayedContent(prev => prev + (prev ? ' ' : '') + word);
        currentWordIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // Adjust speed as needed
    
    return () => clearInterval(typingInterval);
  }, [content]);

  // Auto-resize functionality
  useEffect(() => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;
    
    // Set a minimum height, but allow it to grow as needed
    const newHeight = Math.max(0, contentDiv.scrollHeight);
    contentDiv.style.height = `${newHeight}px`;
  }, [displayedContent]);

  const handleAddClick = () => {
    // Start the fade-out animation
    setButtonFadingOut(true);
    
    // Get the current node
    const currentNode = getNodeById(id);
    
    if (currentNode) {
      // Wait for fade-out animation to complete before creating new node and hiding button
      setTimeout(() => {
        setShowAddButton(false);
        
        // Create a new input node below this response node
        const newInputNode = createInputNode({
          x: currentNode.position.x,
          y: currentNode.position.y + (currentNode.height || 100) + 50
        });
        
        // Fit view to include the new input node
        if (newInputNode) {
          setTimeout(() => {
          reactFlowInstance.fitView({
            padding: 0.5,
            minZoom: 0.5,
            maxZoom: 1.2,
            duration: 500,
            nodes: [
              { id: newInputNode.id }
            ]
          }); 
        }, 200);
        }
      }, 300); // Match the duration of the fade-out animation
    }
  };

  return (
    <Box
      bg="gray.50"
      borderRadius="2xl"
      boxShadow="sm"
      width="500px"
      transition="opacity 0.5s ease, transform 0.5s ease"
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? "translateY(0)" : "translateY(10px)"}
      animation={isVisible ? `${fadeIn} 0.8s ease-out` : undefined}
      data-testid="response-node"
    >
      <Box
        ref={contentRef}
        minHeight="0px"
        borderRadius="2xl"
        fontSize="md"
        color="gray.700"
        p={5}
        overflowY="auto"
        sx={{
          userSelect: 'text',
          cursor: 'auto'
        }}
      >
        <Text whiteSpace="pre-wrap">{displayedContent}</Text>
      </Box>
      <Box position="absolute" bottom="-5" right="3">
        <Box fontSize="2xs" color="gray.400" display="flex" alignItems="center">
          AI's Response
        </Box>
      </Box>
      {useSettingsStore.getState().interfaceType === 1 && showAddButton && (
        <Box 
          position="absolute" 
          bottom="-20" 
          left="0"
          animation={buttonAnimation}
        >
          <IconButton
            aria-label="New conversation"
            id="new-conversation-button"
            icon={<AddIcon />}
            size="sm"
            boxShadow="sm"
            isRound
            variant="ghost"
            color="gray.500"
            backgroundColor="gray.100"
            onClick={handleAddClick}
            transition="all 0.3s ease"
            _hover={{
              bg: "gray.50",
              color: "gray.700"
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ResponseNode; 