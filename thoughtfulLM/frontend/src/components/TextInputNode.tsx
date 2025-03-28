import React, { useCallback, useRef, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { Box, Textarea, Kbd } from '@chakra-ui/react';
import { useThoughtStore } from '../store/thoughtStore';
import { useInputStore } from '../store/inputStore';
import { TextInputNodeData } from '../store/nodeStore';
import { useAutomaticTriggerDetection } from '../hooks';

// Update the node props to use our new node data type
type TextInputNodeProps = NodeProps<TextInputNodeData>;

const TextInputNode: React.FC<TextInputNodeProps> = ({ data, id }) => {
  // Get the input ID from the node data
  const { inputId } = data;
  
  // Get input text from the input store using the inputId
  const inputText = useInputStore(state => {
    const inputData = state.inputs[inputId];
    return inputData ? inputData.currentInput : '';
  });
  
  // Check if this input is active
  const isActive = useInputStore(state => state.activeInputId === inputId);
  
  // Use local state for textarea value with initial value from store
  const [text, setText] = useState(inputText);
  
  // Use the automatic trigger detection hook instead of manual timer management
  useAutomaticTriggerDetection(inputId);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleThoughtsSubmit = useThoughtStore(state => state.handleThoughtsSubmit);

  // Update local state when input store changes
  useEffect(() => {
    setText(inputText);
  }, [inputText]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      
      // Update local state immediately for responsive UI
      setText(newValue);
      
      // Update the input store with the new value
      useInputStore.getState().updateInput(inputId, newValue);
      
      // If there's an onChange handler in the data, call it too
      if (data.onChange) {
        data.onChange(newValue);
      }
    },
    [data, inputId]
  );
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Check for Command/Control + Enter
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault(); // Prevent default behavior (newline)
        
        console.log('Cmd/Ctrl + Enter pressed, submitting thoughts...');
        
        // Call the handleThoughtsSubmit function from the thought store
        handleThoughtsSubmit();
      }
    },
    [handleThoughtsSubmit]
  );

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the right scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content
    const newHeight = Math.max(120, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, [text]);

  return (
    <Box
      bg="gray.50"
      borderRadius="2xl"
      boxShadow="sm"
      width="500px"
      transition="all 0.2s"
    >
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Say anything"
        minHeight="200px"
        resize="none"
        border="none"
        borderRadius="2xl"
        _focus={{
          boxShadow: "md",
          outline: "none"
        }}
        fontSize="md"
        color="gray.700"
        bg="gray.50"
        p={5}
        overflowY="hidden"
        isDisabled={!isActive}
      />
      {isActive ? (
        <Box position="absolute" bottom="-5" right="3">
          <Box fontSize="2xs" color="gray.400" display="flex" alignItems="center">
            <Kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</Kbd>
            <Box as="span" mx="1">+</Box>
            <Kbd>Enter</Kbd>
            <Box as="span" ml="1">to submit</Box>
          </Box>
        </Box>
      ) : (
        <Box position="absolute" bottom="-5" right="3">
          <Box fontSize="2xs" color="gray.400" display="flex" alignItems="center">
            Your Input
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TextInputNode; 