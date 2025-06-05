import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Textarea, 
  IconButton, 
  Flex, 
  Kbd,
  Text,
  keyframes,
  createIcon
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useInputStore } from '../../store/inputStore';
import { useAutomaticTriggerDetection } from '../../hooks/useTriggerDetection';
import { useSettingsStore } from '../../store/settingsStore';

// Define pulse animation for microphone
const pulseAnimation = keyframes`
  0% { background-color: rgba(229, 62, 62, 0.1); }
  50% { background-color: rgba(229, 62, 62, 0.3); }
  100% { background-color: rgba(229, 62, 62, 0.1); }
`;

// Create custom microphone icon
const MicrophoneIcon = createIcon({
  displayName: 'MicrophoneIcon',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M12,2C10.34,2 9,3.34 9,5V11C9,12.66 10.34,14 12,14C13.66,14 15,12.66 15,11V5C15,3.34 13.66,2 12,2M12,4C12.55,4 13,4.45 13,5V11C13,11.55 12.55,12 12,12C11.45,12 11,11.55 11,11V5C11,4.45 11.45,4 12,4M19,10V12C19,15.87 15.87,19 12,19C8.13,19 5,15.87 5,12V10H3V12C3,16.25 6.09,19.78 10,20.73V23H14V20.73C17.91,19.78 21,16.25 21,12V10H19Z"
    />
  ),
});

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
            icon={<MicrophoneIcon />}
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
          icon={<ArrowUpIcon />}
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