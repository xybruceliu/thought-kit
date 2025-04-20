import React, { useRef, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Message, { MessageProps } from './Message';

interface MessageContainerProps {
  messages: MessageProps[];
}

const MessageContainer: React.FC<MessageContainerProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Flex
      // backgroundColor="orange.50"
      direction="column"
      flex="1"
      overflowY="auto"
      px={4}
      pb={4}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '10px',
        },
      }}
    >
      {messages.map((message, index) => (
        <Message
          key={index}
          content={message.content}
          sender={message.sender}
          timestamp={message.timestamp}
          relatedThoughtIds={message.relatedThoughtIds}
        />
      ))}
      <div ref={messagesEndRef} />
    </Flex>
  );
};

export default MessageContainer; 