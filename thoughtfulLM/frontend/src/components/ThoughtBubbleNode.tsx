import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Text, keyframes } from '@chakra-ui/react';
import { Thought } from '../types/thought';

type ThoughtBubbleNodeProps = NodeProps<{
  content: string;
  thought: Thought; // Include the full thought object to access weight and saliency
  blobVariant?: number;
  isRemoving?: boolean;
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
  
  // Calculate importance score from weight and saliency
  const importanceScore = data.thought.score.weight + data.thought.score.saliency;
  
  // Calculate size scale based on importance score (0.5 to 1.5)
  const sizeScale = 0.7 + (importanceScore * 0.5);
  
  // Calculate opacity based on importance score (0.3 to 0.9)
  const opacity = 0.3 + (importanceScore * 0.3);

  // Create a dynamic keyframe animation for this specific bubble with multiple stages
  const morphAnimation = keyframes`
    0% { border-radius: ${blobVariants[startVariantIndex]}; }
    25% { border-radius: ${blobVariants[midVariantIndex]}; }
    50% { border-radius: ${blobVariants[endVariantIndex]}; }
    75% { border-radius: ${blobVariants[midVariantIndex]}; }
    100% { border-radius: ${blobVariants[startVariantIndex]}; }
  `;

  // Entrance animation - fade in, scale up, and morph from circle
  const entranceAnimation = keyframes`
    0% {
      opacity: 0;
      border-radius: 35%;
      transform: scale(${sizeScale * 0.95});
    }
    60% {
      opacity: ${opacity / 2};
      transform: scale(${sizeScale});
    }
    100% {
      opacity: ${opacity};
      border-radius: ${blobVariants[startVariantIndex]};
    }
  `;

  // Exit animation - fade out and shrink
  const exitAnimation = keyframes`
    0% {
      opacity: ${opacity};
      transform: scale(${sizeScale});
    }
    100% {
      opacity: 0;
      transform: scale(${sizeScale * 0.8});
    }
  `;

  // Random animation duration for more natural movement
  const [animationDuration, setAnimationDuration] = useState("7s");
  const [isNew, setIsNew] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const prevIsRemovingRef = useRef(data.isRemoving);
  
  useEffect(() => {
    // Generate a random duration when the component mounts
    const duration = 5 + Math.random() * 5;
    setAnimationDuration(`${duration}s`);
    
    // Set isNew to false after the entrance animation completes
    const timer = setTimeout(() => setIsNew(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Effect to handle removal animation
  useEffect(() => {
    // If isRemoving prop changed from false to true, trigger exit animation
    if (data.isRemoving && !prevIsRemovingRef.current) {
      setIsExiting(true);
    }
    
    // Update ref for next comparison
    prevIsRemovingRef.current = data.isRemoving;
  }, [data.isRemoving]);

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
        boxShadow={`0 0 15px 8px ${colors[colorIndex]}20`}
        minWidth="100px"
        maxWidth="200px"
        height="auto"
        padding="20px 14px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="none"
        cursor="grab"
        className="thought-bubble"
        // Simplified styling - separate scale from animation
        style={{
          opacity: isExiting ? 0 : opacity,
          transform: `scale(${sizeScale})`,
        }}
        animation={
          isExiting
            ? `${exitAnimation} 1s ease-out forwards`
            : isNew 
              ? `${entranceAnimation} 1s ease-out forwards` 
              : `${morphAnimation} ${animationDuration} ease-in-out infinite`
        }
        _active={{
          cursor: "grabbing",
        }}
        _hover={{
          boxShadow: `0 0 17px 10px ${colors[colorIndex]}40`,
        }}
        onClick={(e) => {
          // Prevent bubbling to parent elements
          e.stopPropagation();
          
          // Dispatch custom event with thought ID for handling in parent components
          const event = new CustomEvent('thought-click', { 
            bubbles: true, 
            detail: { thoughtId: data.thought.id } 
          });
          e.currentTarget.dispatchEvent(event);
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