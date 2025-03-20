import React, { useState, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Text, keyframes } from '@chakra-ui/react';

type ThoughtBubbleNodeProps = NodeProps<{
  content: string;
  blobVariant?: number;
}>;


// Array of different blob shapes using CSS border-radius
// Updated for more distinct, smoother shapes without sharp corners
const blobVariants = [
  "70% 80% 50% 70% / 60% 80% 60% 70%",  // Variant 1 - tall cloud
  "80% 60% 80% 50% / 80% 60% 70% 60%",  // Variant 2 - wide cloud
  "65% 80% 65% 80% / 80% 65% 80% 65%",  // Variant 3 - rounded square
  "90% 60% 70% 80% / 60% 90% 60% 70%",  // Variant 4 - egg shape
  "70% 90% 60% 90% / 90% 60% 90% 60%",  // Variant 5 - diagonal blob
];


// Array of modern vibrant colors
const colors = [
  "#FFBDEA",  
  "#FEFFBE", 
  "#CBFFE6",  
  "#AFE9FF",  
  "#BFB9FF",  
];

const ThoughtBubbleNode: React.FC<ThoughtBubbleNodeProps> = ({ data, selected }) => {
  // Get three different variant indices to create more dramatic animation
  const startVariantIndex = data.blobVariant !== undefined ? data.blobVariant % blobVariants.length : 0;
  const midVariantIndex = (startVariantIndex + 2) % blobVariants.length; // Skip one to get more contrast
  const endVariantIndex = (startVariantIndex + 4) % blobVariants.length; // Skip more for even more contrast
  const colorIndex = data.blobVariant !== undefined ? data.blobVariant % colors.length : 0;
  
  // Create a dynamic keyframe animation for this specific bubble with multiple stages
  const morphAnimation = keyframes`
    0% { 
      border-radius: ${blobVariants[startVariantIndex]};
      transform: scale(1);
    }
    25% { 
      border-radius: ${blobVariants[midVariantIndex]};
      transform: scale(1.03);
    }
    50% { 
      border-radius: ${blobVariants[endVariantIndex]};
      transform: scale(1);
    }
    75% { 
      border-radius: ${blobVariants[midVariantIndex]};
      transform: scale(0.97);
    }
    100% { 
      border-radius: ${blobVariants[startVariantIndex]};
      transform: scale(1);
    }
  `;

  // Entrance animation - fade in, scale up, and morph from circle
  const entranceAnimation = keyframes`
    0% {
      opacity: 0;
      border-radius: 35%;
      transform: scale(0.95);
    }
    60% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 1;
      border-radius: ${blobVariants[startVariantIndex]};
      
    }
  `;

  // Random animation duration for more natural movement
  const [animationDuration, setAnimationDuration] = useState("7s");
  const [isNew, setIsNew] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    // Generate a random duration when the component mounts
    const duration = 7 + Math.random() * 5;
    setAnimationDuration(`${duration}s`);
    
    // Set isNew to false after the entrance animation completes
    const timer = setTimeout(() => setIsNew(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      style={{ position: 'relative' }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <Box
        bg="white"
        borderRadius={blobVariants[startVariantIndex]}
        boxShadow={`0 0 10px 5px ${colors[colorIndex]}20`}
        minWidth="100px"
        maxWidth="200px"
        height="auto"
        padding="20px 14px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="none"
        cursor="grab"
        // Enhanced physics effect for dragging with more pronounced spring and delay
        style={{
          transition: isDragging 
            ? 'none' 
            : 'transform 0.8s cubic-bezier(0.19, 1.69, 0.42, 0.9) 0.1s',
          willChange: 'transform',
        }}
        animation={
          isNew 
            ? `${entranceAnimation} 1s ease-out forwards` 
            : `${morphAnimation} ${animationDuration} ease-in-out infinite`
        }
        _active={{
          cursor: "grabbing",
        }}
        _hover={{
          boxShadow: `0 0 10px 8px ${colors[colorIndex]}40`,
        }}
      >
        <Text
          textAlign="center"
          fontSize="2xs"
          color="gray.500"
          fontFamily="monospace"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {data.content}
        </Text>
      </Box>
      {/* Invisible handle to improve drag experience */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  );
};

export default ThoughtBubbleNode; 