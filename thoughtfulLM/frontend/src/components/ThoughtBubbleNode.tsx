import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Text, keyframes, IconButton, Fade, Icon } from '@chakra-ui/react';
import { useThoughtStore } from '../store/thoughtStore';
import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { ThoughtBubbleNodeData, useNodeStore } from '../store/nodeStore';

// Update the type to use our unified node data type
type ThoughtBubbleNodeProps = NodeProps<ThoughtBubbleNodeData>;

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
  "#FFB9B9",
];

const ThoughtBubbleNode: React.FC<ThoughtBubbleNodeProps> = ({ data, selected, id }) => {
  // Get the thought from the store using the thoughtId from our node data
  const { thoughtId } = data;
  
  // Get thought store functions and the specific thought
  const thought = useThoughtStore(state => state.thoughts.find(t => t.id === thoughtId));
  const handleThoughtPin = useThoughtStore(state => state.handleThoughtPin);
  const handleThoughtDelete = useThoughtStore(state => state.handleThoughtDelete);
  const handleThoughtLike = useThoughtStore(state => state.handleThoughtLike);
  const handleThoughtDislike = useThoughtStore(state => state.handleThoughtDislike);
  
  // Get node store functions
  const markNodeAsRemoving = useNodeStore(state => state.markNodeAsRemoving);
  const isRemoving = useNodeStore(state => state.removingNodeIds.includes(id));
  
  // IMPORTANT: All hooks must be called at the top level, before any conditional returns
  // Random animation duration for more natural movement
  const [animationDuration, setAnimationDuration] = useState("7s");
  const [isNew, setIsNew] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const prevIsRemovingRef = useRef(isRemoving);
  
  // Add state for hovering and mouse position
  const [isHovering, setIsHovering] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showPinButton, setShowPinButton] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Get the content from the thought
  const content = thought?.content?.text || '';
  
  // Get blob variant (random if not specified)
  const blobVariant = data.blobVariant !== undefined 
    ? data.blobVariant 
    : Math.floor(Math.random() * blobVariants.length);
  
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
    if (isRemoving && !prevIsRemovingRef.current) {
      setIsExiting(true);
    }
    
    // Update ref for next comparison
    prevIsRemovingRef.current = isRemoving;
  }, [isRemoving]);
  
  // Function to handle mouse movement and determine which quadrant
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!bubbleRef.current || isDragging) return;
    
    const rect = bubbleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element

    // Show a small tag on the bottom right of the bubble to indicate the type of thought
    
    
    // Make the detection areas smaller by adjusting the thresholds
    // Check if mouse is in the top right quadrant - smaller area
    const isTopRight = x > rect.width * 0.7 && y < rect.height * 0.5;
    // Check if mouse is in the top left quadrant - smaller area
    const isTopLeft = x < rect.width * 0.3 && y < rect.height * 0.5;
    
    setShowDeleteButton(isTopLeft);
    setShowPinButton(isTopRight);
    
    // Determine which side of the bubble the mouse is on
    // Use the same boundary as the click handler for consistency
    setHoverSide(x < rect.width * (3/7) ? 'left' : 'right');
  };
  
  // Handle click on bubble and determine if it's left or right side
  const handleBubbleClick = (e: React.MouseEvent) => {
    // Prevent bubbling to parent elements
    e.stopPropagation();
    
    if (!bubbleRef.current || !thoughtId) return;
    
    const rect = bubbleRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const bubbleWidth = rect.width;
    
    // If click is on the left half, dislike; if on the right half, like
    if (clickX < bubbleWidth * (2/5)) {
      console.log(`Disliking thought: ${thoughtId}`);
      handleThoughtDislike(thoughtId);
    } else {
      console.log(`Liking thought: ${thoughtId}`);
      handleThoughtLike(thoughtId);
    }
  };
  
  // Handle thought deletion with animation
  const onDeleteThought = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thoughtId) return;
    
    console.log(`Deleting thought: ${thoughtId}`);
    
    // Mark the node as removing in the node store first (for animation)
    markNodeAsRemoving(id);
    
    // Then schedule the actual deletion after animation completes
    setTimeout(() => {
      handleThoughtDelete(thoughtId);
    }, 1000); // Match with exit animation duration
  };
  
  // Handle thought pinning
  const onPinThought = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thoughtId) return;
    
    console.log(`Pinning thought: ${thoughtId}`);
    handleThoughtPin(thoughtId);
  };
  
  // If thought is not found, show minimal content
  if (!thought) {
    // Check if this node is in the process of being removed
    if (isRemoving) {
      // Return an empty fragment - nothing will be rendered during removal
      return <></>;
    }
    return <Box>Content not found</Box>;
  }
  
  // Get three different variant indices to create more dramatic animation
  const startVariantIndex = blobVariant % blobVariants.length;
  const midVariantIndex = (startVariantIndex + 2) % blobVariants.length; // Skip one to get more contrast
  const endVariantIndex = (startVariantIndex + 4) % blobVariants.length; // Skip more for even more contrast
  // color index based on thought type
  // association = 0, disambiguation = 1, empathy = 2, interpretation = 3, reference = 4, scaffolding = 5
  const colorIndex = thought.seed?.type === 'association' ? 0 : 
                     thought.seed?.type === 'disambiguation' ? 1 : 
                     thought.seed?.type === 'empathy' ? 2 : 
                     thought.seed?.type === 'interpretation' ? 3 : 
                     thought.seed?.type === 'reference' ? 4 : 
                     thought.seed?.type === 'scaffolding' ? 5 : 
                     Math.floor(Math.random() * colors.length);
  
  // Calculate importance score from weight and saliency
  const importanceScore = thought.score.weight + thought.score.saliency;
  
  // Calculate size scale based on importance score (0.5 to 1.5)
  const sizeScale = 0.7 + (importanceScore * 0.5);
  
  // Calculate hover effect scale modification
  // Shrink by 3% when hovering left side, expand by 3% when hovering right side
  const hoverScaleModifier = isHovering 
    ? (hoverSide === 'left' ? 0.97 : (hoverSide === 'right' ? 1.03 : 1)) 
    : 1;
  
  // Calculate opacity based on importance score (0.2 to 1.0)
  // If thought is pinned (persistent), use full opacity (1)
  const baseOpacity = 0.2 + (importanceScore * 0.4);
  const opacity = thought.config.persistent ? 1 : baseOpacity;

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
        setHoverSide(null);
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
        opacity={isExiting ? 0 : opacity}
        style={{
          transform: `scale(${sizeScale * hoverScaleModifier})`,
          backdropFilter: "blur(5px)",
          transition: "border-radius 0.5s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
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
          opacity: 1,
          boxShadow: `0 0 ${shadowBlur + 2}px ${shadowSize + 2}px ${colors[colorIndex]}50`,
        }}
        onClick={handleBubbleClick}
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
          {content}
        </Text>
        
        {/* Star (pin) button */}
        <Box 
          position="absolute"
          top="-16px"
          right="-19px"
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
            onClick={onPinThought}
            _hover={{
              bg: "none",
              color: "yellow.600"
            }}
          />
        </Box>
        
        {/* Delete button */}
        <Box 
          position="absolute"
          top="-10px"
          left="-15px"
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
            icon={<DeleteIcon />}
            size="sm"
            isRound
            variant="ghost"
            color="gray.500"
            onClick={onDeleteThought}
            _hover={{
              bg: "none",
              color: "red.600"
            }}
          />
        </Box>

        {/* Thought type indicator tag - only visible on hover */}
        <Fade in={isHovering} unmountOnExit>
          <Box
            position="absolute"
            bottom="-8px"
            right="-8px"
            bg={`${colors[colorIndex]}50`}
            opacity={0.7}
            color="gray.600"
            fontSize="2xs"
            fontStyle="italic"
            px="4px"
            py="1px"
            borderRadius="6px"
            boxShadow="0 1px 2px rgba(0,0,0,0.1)"
            style={{
              transform: `scale(${1/sizeScale})`,
              textTransform: 'capitalize'
            }}
            transition="transform 0.2s ease-in-out, opacity 0.2s ease-in-out"
          >
            {thought.seed?.type || 'thought'}
          </Box>
        </Fade>
      </Box>
      {/* Invisible handle to improve drag experience */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  );
};

export default ThoughtBubbleNode; 