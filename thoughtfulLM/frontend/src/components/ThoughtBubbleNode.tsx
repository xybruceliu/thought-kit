import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Text, keyframes, IconButton, Fade } from '@chakra-ui/react';
import { useThoughtStore } from '../store/thoughtStore';
import { CloseIcon, StarIcon } from '@chakra-ui/icons';

type ThoughtBubbleNodeProps = NodeProps<{
  content: string;
  thoughtId: string; // Store the thought ID instead of the full object
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
  // Get the thought from the store using the thoughtId
  const thoughts = useThoughtStore(state => state.thoughts);
  const handleThoughtPin = useThoughtStore(state => state.handleThoughtPin);
  const handleThoughtDelete = useThoughtStore(state => state.handleThoughtDelete);
  const handleThoughtClick = useThoughtStore(state => state.handleThoughtClick);

  const thought = thoughts.find(t => t.id === data.thoughtId);
  
  // IMPORTANT: All hooks must be called at the top level, before any conditional returns
  // Random animation duration for more natural movement
  const [animationDuration, setAnimationDuration] = useState("7s");
  const [isNew, setIsNew] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const prevIsRemovingRef = useRef(data.isRemoving);
  
  // Add state for hovering and mouse position
  const [isHovering, setIsHovering] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showPinButton, setShowPinButton] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Hook for setting animation duration
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
  
  // Function to handle mouse movement and determine which quadrant
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!bubbleRef.current || isDragging) return;
    
    const rect = bubbleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    // Check if mouse is in the top right quadrant
    const isTopRight = x > rect.width / 1.5 && y < rect.height / 1.5;
    // Check if mouse is in the top left quadrant
    const isTopLeft = x < rect.width / 3 && y < rect.height / 1.5;
    
    setShowDeleteButton(isTopRight);
    setShowPinButton(isTopLeft);
  };
  
  // If thought is not found, show minimal content
  if (!thought) {
    return <Box>Content not found</Box>;
  }
  
  // Get three different variant indices to create more dramatic animation
  const startVariantIndex = data.blobVariant !== undefined ? data.blobVariant % blobVariants.length : 0;
  const midVariantIndex = (startVariantIndex + 2) % blobVariants.length; // Skip one to get more contrast
  const endVariantIndex = (startVariantIndex + 4) % blobVariants.length; // Skip more for even more contrast
  const colorIndex = data.blobVariant !== undefined ? data.blobVariant % colors.length : 0;
  
  // Calculate importance score from weight and saliency
  const importanceScore = thought.score.weight + thought.score.saliency;
  
  // Calculate size scale based on importance score (0.5 to 1.5)
  const sizeScale = 0.7 + (importanceScore * 0.5);
  
  // Calculate opacity based on importance score (0.2 to 1.0)
  const opacity = 0.2 + (importanceScore * 0.4);

  // Calculate shadow size based on importance score
  const shadowSize = 7 + (importanceScore * 9); 
  const shadowBlur = 10 + (importanceScore * 12); 
  

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

  return (
    <div 
      style={{ position: 'relative' }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => {
        setIsDragging(false);
        setIsHovering(false);
        setShowDeleteButton(false);
        setShowPinButton(false);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
    >
      <Box
        ref={bubbleRef}
        bg={`linear-gradient(135deg, white 0%, ${colors[colorIndex]}20 100%)`}
        borderRadius={blobVariants[startVariantIndex]}
        boxShadow={`0 0 ${shadowBlur}px ${shadowSize}px ${colors[colorIndex]}30, inset 0 0 15px rgba(255, 255, 255, 0.8)`}
        border="none"
        minWidth="100px"
        maxWidth="200px"
        height="auto"
        padding="20px 14px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="grab"
        className="thought-bubble"
        style={{
          opacity: isExiting ? 0 : opacity,
          transform: `scale(${sizeScale})`,
          backdropFilter: "blur(5px)",
          transition: "border-radius 0.5s ease-in-out",  // Smoother transitions between shapes
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
          boxShadow: `0 0 ${shadowBlur + 2}px ${shadowSize + 2}px ${colors[colorIndex]}50`,
        }}
        onClick={(e) => {
          // Prevent bubbling to parent elements
          e.stopPropagation();
          
          // Directly call handleThoughtClick instead of dispatching a custom event
          if (data.thoughtId) {
            handleThoughtClick(data.thoughtId);
          }
        }}
        position="relative"
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
        
        {/* Star (pin) button */}
        <Box 
          position="absolute"
          top="-15px"
          left="-15px"
          opacity={thought.config.persistent || showPinButton ? opacity : 0}
          visibility={thought.config.persistent || showPinButton ? "visible" : "hidden"}
          transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
          zIndex="1"
          style={{
            transform: `scale(${1/sizeScale})`
          }}
        >
          <IconButton
            aria-label={thought.config.persistent ? "Unpin thought" : "Pin thought"}
            icon={<StarIcon />}
            size="md"
            isRound
            variant="ghost"
            color={thought.config.persistent ? "yellow.300" : "gray.500"}
            onClick={(e) => {
              e.stopPropagation();
              if (thought) {
                handleThoughtPin(thought.id);
              }
            }}
            _hover={{
              bg: "none",
              color: thought.config.persistent ? "yellow.500" : "gray.700"
            }}
          />
        </Box>
        
        {/* Delete button */}
        <Box 
          position="absolute"
          top="-6px"
          right="-6px"
          opacity={showDeleteButton ? opacity : 0}
          visibility={showDeleteButton ? "visible" : "hidden"}
          transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
          zIndex="1"
          style={{
            transform: `scale(${1/sizeScale})`
          }}
        >
          <IconButton
            aria-label="Delete thought"
            icon={<CloseIcon />}
            size="xs"
            isRound
            variant="ghost"
            color="gray.500"
            onClick={(e) => {
              e.stopPropagation();
              if (thought) {
                handleThoughtDelete(thought.id);
              }
            }}
            _hover={{
              bg: "none",
              color: "gray.700"
            }}
          />
        </Box>
      </Box>
      {/* Invisible handle to improve drag experience */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  );
};

export default ThoughtBubbleNode; 