import React, { useCallback, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Box, Textarea } from '@chakra-ui/react';
import { useTextInput } from '../hooks';

type TextInputNodeProps = NodeProps<{
  value?: string;
  onChange?: (value: string) => void;
}>;

const TextInputNode: React.FC<TextInputNodeProps> = ({ data }) => {
  const { text, handleTextChange } = useTextInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      handleTextChange(newValue);
      
      // Also call the original onChange if provided
      if (data.onChange) {
        data.onChange(newValue);
      }
    },
    [data, handleTextChange]
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
      width="450px"
      transition="all 0.2s"
    >
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder="Ask anything"
        minHeight="150px"
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