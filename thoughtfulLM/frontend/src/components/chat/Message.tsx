import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Flex, Badge, Wrap, WrapItem, Tooltip } from '@chakra-ui/react';
import { useThoughtStore } from '../../store/thoughtStore';

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  relatedThoughtIds?: string[];
}

const Message: React.FC<MessageProps> = ({ content, sender, timestamp, relatedThoughtIds = [] }) => {
  // Calculate message styling based on sender
  const isUser = sender === 'user';
  const [displayedContent, setDisplayedContent] = useState(isUser ? content : '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Get thoughts content when this is an AI message with related thought IDs
  const relatedThoughts = useThoughtStore(state => 
    !isUser && relatedThoughtIds.length > 0 
      ? state.getThoughtsByIds(relatedThoughtIds) 
      : []
  );
  
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
      {/* Display thought badges for AI messages */}
      {!isUser && relatedThoughts.length > 0 && (
        <Flex px={4}>
          <Wrap>
            {relatedThoughts.map(thought => (
              <WrapItem key={thought.id}>
                <Tooltip 
                  label={thought.content.text} 
                  placement="top"
                  openDelay={100}
                >
                  <Badge 
                    // colorScheme="green" 
                    variant="outline" 
                    borderRadius="full" 
                    px={2} 
                    py={0.5}
                    fontSize="xs"
                    cursor="pointer"
                  >
                    {thought.content.text.length > 20 
                      ? thought.content.text.substring(0, 20) + '...' 
                      : thought.content.text}
                  </Badge>
                </Tooltip>
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