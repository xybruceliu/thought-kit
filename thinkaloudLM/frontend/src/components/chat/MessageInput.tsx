import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Textarea, 
  IconButton, 
  Flex, 
  Kbd,
  Text,
  keyframes
} from '@chakra-ui/react';
import { ArrowUp, Mic } from 'lucide-react';
import { useInputStore } from '../../store/inputStore';
import { useAutomaticTriggerDetection } from '../../hooks/useTriggerDetection';
import { useSettingsStore } from '../../store/settingsStore';

// Define pulse animation for microphone
const pulseAnimation = keyframes`
  0% { background-color: rgba(229, 62, 62, 0.1); }
  50% { background-color: rgba(229, 62, 62, 0.3); }
  100% { background-color: rgba(229, 62, 62, 0.1); }
`;



interface MessageInputProps {
  onSubmit?: (message: string) => void;
  onMicrophoneClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSubmit,
  onMicrophoneClick,
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
        pr="100px" // Add more right padding to make room for both buttons
        _disabled={{
          opacity: 1,
          color: "gray.700",
          bg: "gray.200",
          cursor: "auto"
        }}
      />
      
      {/* Button Container */}
      <Flex position="absolute" bottom="3" right="3" gap={2} zIndex={2}>
        {/* Microphone Button */}
        {onMicrophoneClick && (
          <IconButton
            aria-label="Microphone"
            icon={<Mic className="lucide lucide-sm"/>}
            onClick={onMicrophoneClick}
            size="sm"
            borderRadius="full"
            bg={microphoneEnabled ? "red.100" : "white"}
            color={microphoneEnabled ? "red.600" : "gray.600"}
            boxShadow="sm"
            _hover={{
              bg: microphoneEnabled ? "red.200" : "gray.50",
              boxShadow: "md"
            }}
            _active={{
              bg: microphoneEnabled ? "red.300" : "gray.100",
              boxShadow: "sm"
            }}
            sx={{
              animation: microphoneEnabled ? `${pulseAnimation} 1.5s infinite` : "none",
              transition: "background-color 0.3s ease"
            }}
          />
        )}
        
        {/* Submit Button */}
        <IconButton
          aria-label="Submit message"
          icon={<ArrowUp className="lucide lucide-sm"/>}
          onClick={handleSubmit}
          isDisabled={!message.trim() || disabled}
          size="sm"
          borderRadius="full"
          bg="white"
          color="gray.600"
          boxShadow="sm"
          _hover={{
            bg: "gray.50",
            boxShadow: "md"
          }}
          _active={{
            bg: "gray.100",
            boxShadow: "sm"
          }}
          _disabled={{
            bg: "gray.50",
            color: "gray.300",
            cursor: "not-allowed",
            _hover: {
              bg: "gray.50",
              boxShadow: "none"
            }
          }}
          transition="all 0.2s"
        />
      </Flex>
    </Box>
  );
};

export default MessageInput; 