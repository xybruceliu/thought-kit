import React, { useCallback, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { Box, Textarea } from '@chakra-ui/react';
import { useTextInput } from '../hooks';

type TextInputNodeProps = NodeProps<{
  value?: string;
  onChange?: (value: string) => void;
}>;

const TextInputNode: React.FC<TextInputNodeProps> = ({ data, id }) => {
  const { text, handleTextChange } = useTextInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reactFlowInstance = useReactFlow();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      const textInputNode = reactFlowInstance.getNode(id);
      if (textInputNode) {
        handleTextChange(newValue, textInputNode);
      }
   
      
      // Also call the original onChange if provided
      if (data.onChange) {
        data.onChange(newValue);
      }
    },
    [data, handleTextChange, id, reactFlowInstance]
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
        placeholder="Ask anything"
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
    </Box>
  );
};

export default TextInputNode; 