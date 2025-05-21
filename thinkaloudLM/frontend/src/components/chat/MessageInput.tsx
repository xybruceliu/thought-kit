import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Textarea, 
  IconButton, 
  Flex, 
  Kbd,
  Text
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useInputStore } from '../../store/inputStore';
import { useAutomaticTriggerDetection } from '../../hooks/useTriggerDetection';
import { useSettingsStore } from '../../store/settingsStore';

interface MessageInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSubmit,
  placeholder = 'Say anything',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentInput = useInputStore(state => state.inputData.currentInput);
  const updateInput = useInputStore(state => state.updateInput);
  const updateActivityTimestamp = useInputStore(state => state.updateActivityTimestamp);
  const microphoneEnabled = useSettingsStore(state => state.microphoneEnabled);
  
  // Set up automatic trigger detection
  useAutomaticTriggerDetection();

  // Sync with the inputStore for speech recognition
  useEffect(() => {
    // Only update the local state if the inputStore has a different value
    // This prevents loops when typing manually
    if (currentInput !== message) {
      setMessage(currentInput);
    }
  }, [currentInput, message]);

  // Update activity timestamp on any user interaction
  const updateActivity = () => {
    updateActivityTimestamp();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Update the input store with the new message
    updateInput(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Update activity timestamp on any keydown
    updateActivity();
    
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    
    // Only call onSubmit if it's provided
    if (onSubmit) {
      onSubmit(message.trim());
    }
    
    setMessage('');
    
    // Clear the input in the store after submission
    updateInput('');
  };

  return (
    <Box
      id="message-input"
      bg="gray.50"
      borderRadius="2xl"
      boxShadow="sm"
      width="100%"
      transition="all 0.2s"
      position="relative"
    >
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={updateActivity}
        onClick={updateActivity}
        placeholder={placeholder}
        resize="none"
        minH="125px"
        // overflow="hidden"
        border="none"
        borderRadius="2xl"
        _focus={{
          boxShadow: "md",
          outline: "none"
        }}
        fontSize="md"
        color="gray.700"
        bg="gray.200"
        p={5}
        _disabled={{
          opacity: 1,
          color: "gray.700",
          bg: "gray.200",
          cursor: "auto"
        }}
      />
      <Box position="absolute" bottom="-6" right="3">
        <Box fontSize="xs" color="gray.400" display="flex" alignItems="center">
          <Kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</Kbd>
          <Box as="span" mx="1">+</Box>
          <Kbd>Enter</Kbd>
          <Box as="span" ml="1">to submit</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageInput; 