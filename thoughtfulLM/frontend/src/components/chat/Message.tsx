import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  relatedThoughtIds?: string[];
}

const Message: React.FC<MessageProps> = ({ content, sender, timestamp }) => {
  // Calculate message styling based on sender
  const isUser = sender === 'user';
  
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Flex
      justify={isUser ? 'flex-end' : 'flex-start'}
      mb={3}
      width="100%"
    >
      <Box
        bg={isUser ? 'gray.200' : 'blue.100'}
        color={isUser ? 'gray.700' : 'gray.800'}
        borderRadius="lg"
        px={4}
        py={3}
        maxWidth="70%"
        boxShadow="sm"
      >
        <Text fontSize="md" whiteSpace="pre-wrap" wordBreak="break-word">
          {content}
        </Text>
        {/* <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
          {formattedTime}
        </Text> */}
      </Box>
    </Flex>
  );
};

export default Message; 