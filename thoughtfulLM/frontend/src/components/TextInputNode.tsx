import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Box, Textarea } from '@chakra-ui/react';

type TextInputNodeProps = NodeProps<{
  value?: string;
  onChange?: (value: string) => void;
}>;

const TextInputNode: React.FC<TextInputNodeProps> = ({ data }) => {
  const [text, setText] = useState(data.value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setText(newValue);
      if (data.onChange) {
        data.onChange(newValue);
      }
    },
    [data]
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
      borderRadius="lg"
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