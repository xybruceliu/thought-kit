import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Flex, Wrap, WrapItem, Tooltip } from '@chakra-ui/react';
import { useThoughtStore } from '../../store/thoughtStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Thought } from '../../types/thought';

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  relatedThoughtIds?: string[];
}

// Array of modern vibrant colors (same as ThoughtBubbleNode.tsx)
const colors = [
  "#FFBDEA",  // association - pink
  "#FEFFBE",  // disambiguation - yellow
  "#CBFFE6",  // empathy - green
  "#AFE9FF",  // interpretation - blue
  "#BFB9FF",  // reference - purple
  "#FFB9B9",  // scaffolding - red
];

// Custom thought pill component
const ThoughtPill: React.FC<{ thought: Thought }> = ({ thought }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine color index based on thought type (same logic as ThoughtBubbleNode)
  const colorIndex = thought.seed?.type === 'association' ? 0 : 
                     thought.seed?.type === 'disambiguation' ? 1 : 
                     thought.seed?.type === 'empathy' ? 2 : 
                     thought.seed?.type === 'interpretation' ? 3 : 
                     thought.seed?.type === 'reference' ? 4 : 
                     thought.seed?.type === 'scaffolding' ? 5 : 
                     Math.floor(Math.random() * colors.length);
  
  // Calculate importance score from weight and saliency
  const importanceScore = thought.score.weight + thought.score.saliency;
  
  // Calculate opacity based on importance score (0.2 to 1.0)
  // If thought is pinned (persistent), use full opacity (1)
  const baseOpacity = 0.2 + (importanceScore * 0.4);
  const opacity = thought.config.persistent ? 1 : baseOpacity;
  
  const text = thought.content.text;
  const displayText = isHovered || text.length <= 20 ? text : text.substring(0, 20) + '...';
  
  return (
    <Box
      bg="white"
      opacity={opacity}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="2xs"
      color="gray.500"
      fontFamily="monospace"
      boxShadow={`0 2px 8px ${colors[colorIndex]}50, inset 0 0 2px ${colors[colorIndex]}30`}
      border="1px solid"
      borderColor={`${colors[colorIndex]}20`}
      _hover={{
        transform: "translateY(-1px)",
        boxShadow: `0 4px 12px ${colors[colorIndex]}60`,
        opacity: 1,
        transition: "all 0.3s ease"
      }}
      transition="all 0.3s ease"
      cursor="pointer"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whiteSpace="nowrap"
      overflow="hidden"
      maxWidth={isHovered ? "300px" : "auto"}
    >
      {displayText}
    </Box>
  );
};

const Message: React.FC<MessageProps> = ({ content, sender, timestamp, relatedThoughtIds = [] }) => {
  // Calculate message styling based on sender
  const isUser = sender === 'user';
  const [displayedContent, setDisplayedContent] = useState(isUser ? content : '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Get showThoughtPills setting
  const showThoughtPills = useSettingsStore(state => state.showThoughtPills);
  
  // Get thoughts content when this is an AI message with related thought IDs
  const relatedThoughts = useThoughtStore(state => 
    !isUser && relatedThoughtIds.length > 0 
      ? state.getThoughtsByIds(relatedThoughtIds) 
      : []
  );
  
  // Sort thoughts by importance score (highest first)
  const sortedThoughts = [...relatedThoughts].sort((a, b) => {
    const scoreA = a.score.weight + a.score.saliency + (a.config.persistent ? 10 : 0);
    const scoreB = b.score.weight + b.score.saliency + (b.config.persistent ? 10 : 0);
    return scoreB - scoreA; // Descending order (highest first)
  });
  
  // Streaming effect for AI messages
  useEffect(() => {
    if (isUser) return;
    
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(currentIndex + 1);
        
        // Scroll to bottom with each character update
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 5); // Adjust speed here (lower = faster)
      
      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, isUser]);
  
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Flex
      justify={isUser ? 'flex-end' : 'flex-start'}
      mb={10}
      width="100%"
      flexDirection="column"
    >
      {/* Display thought pills for AI messages */}
      {!isUser && showThoughtPills && sortedThoughts.length > 0 && (
        <Flex px={4}>
          <Wrap spacing={2}>
            {sortedThoughts.map(thought => (
              <WrapItem key={thought.id}>
                <ThoughtPill thought={thought} />
              </WrapItem>
            ))}
          </Wrap>
        </Flex>
      )}
      
      {/* Message content */}
      <Box
        bg={isUser ? 'gray.200' : 'none'}
        color="gray.700"
        borderRadius="lg"
        px={4}
        py={3}
        maxWidth={isUser ? '70%' : '100%'}
        boxShadow={isUser ? 'sm' : 'none'}
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
      >
        <Text fontSize="md" whiteSpace="pre-wrap" wordBreak="break-word">
          {displayedContent}
        </Text>
        {/* <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
          {formattedTime}
        </Text> */}
        <div ref={messageEndRef} />
      </Box>
    </Flex>
  );
};

export default Message; 