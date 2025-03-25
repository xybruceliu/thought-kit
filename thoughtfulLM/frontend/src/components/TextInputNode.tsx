import React, { useCallback, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Box, Textarea, Kbd } from '@chakra-ui/react';
import { useInputNodes } from '../hooks';
import { useThoughtStore } from '../store/thoughtStore';

type TextInputNodeProps = NodeProps<{
  value?: string;
  onChange?: (value: string) => void;
}>;

const TextInputNode: React.FC<TextInputNodeProps> = ({ data, id }) => {
  const { getInputText, handleTextChange } = useInputNodes();
  const text = getInputText(id);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reactFlowInstance = useReactFlow();
  const handleThoughtsSubmit = useThoughtStore(state => state.handleThoughtsSubmit);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      const textInputNode = reactFlowInstance.getNode(id);
      if (textInputNode) {
        handleTextChange(id, newValue, textInputNode);
      }
   
      // Also call the original onChange if provided
      if (data.onChange) {
        data.onChange(newValue);
      }
    },
    [data, handleTextChange, id, reactFlowInstance]
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
      bg="white"
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
        bg="white"
        p={5}
        overflowY="hidden"
      />
      <Box position="absolute" bottom="-5" right="3">
        <Box fontSize="2xs" color="gray.400" display="flex" alignItems="center">
          <Kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</Kbd>
          <Box as="span" mx="1">+</Box>
          <Kbd>Enter</Kbd>
          <Box as="span" ml="1">to submit</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TextInputNode; 