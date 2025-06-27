import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Text, keyframes, IconButton, Fade, Icon, Tooltip } from '@chakra-ui/react';
import { useThoughtStore } from '../store/thoughtStore';
import { X, Pin, Heart, ThumbsDown, MessageCircle, Brain, Bubbles, Minus, Plus } from 'lucide-react';
import { ThoughtBubbleNodeData, useNodeStore } from '../store/nodeStore';
import { deleteThoughtNode } from '../hooks/nodeConnectors';

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
  const handleThoughtLike = useThoughtStore(state => state.handleThoughtLike);
  const handleThoughtDislike = useThoughtStore(state => state.handleThoughtDislike);
  const handleThoughtComment = useThoughtStore(state => state.handleThoughtComment);
  
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
  const [showBottomToolbar, setShowBottomToolbar] = useState(false);
  const [isHeartClicked, setIsHeartClicked] = useState(false);
  const [isThumbsDownClicked, setIsThumbsDownClicked] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Add ref for tracking last mouse position for drag trailing effect
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  
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
    if (!bubbleRef.current) return;
    
    const rect = bubbleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    // If dragging, update the last position for the trailing effect
    if (isDragging) {
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    // Only set hover side if mouse is within the actual bubble boundaries
    // This prevents size scaling when hovering over tooltip zones
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      // Determine which side of the bubble the mouse is on for click handling and size scaling
      // Use the same boundary as the click handler for consistency
      setHoverSide(x < rect.width * (3/7) ? 'left' : 'right');
    } else {
      // Reset hover side when outside bubble boundaries to prevent scaling
      setHoverSide(null);
    }
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
    // mark the node as removing in the node store for animation
    markNodeAsRemoving(id);
    // Then schedule the actual deletion after animation completes
    setTimeout(() => {
      deleteThoughtNode(thoughtId);
    }, 1000); // Match with exit animation duration
  };
  
  // Handle thought pinning
  const onPinThought = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thoughtId) return;
    
    console.log(`Pinning thought: ${thoughtId}`);
    handleThoughtPin(thoughtId);
  };
  
  // Handle comment functionality
  const onCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCommentInput(true);
  };
  
  const onSaveComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (commentText.trim() && thoughtId) {
      console.log(`Saving comment for thought: ${thoughtId}`, commentText);
      // Add comment to the thought's user_comments array in the store
      handleThoughtComment(thoughtId, commentText.trim());
      setCommentText('');
    }
    setShowCommentInput(false);
  };
  
  const onCancelComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentText('');
    setShowCommentInput(false);
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
  
  // Calculate importance score from weight
  const importanceScore = thought.score.weight;
  
  // Calculate size scale based on importance score
  const sizeScale = 0.8 + importanceScore * 0.7
  
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
  const shadowSize = 5 + (importanceScore * 7); 
  const shadowBlur = 8 + (importanceScore * 10); 
  

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
      className={`thought-bubble-weighted ${isDragging ? 'dragging' : ''}`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => {
        setIsDragging(false);
        setIsHovering(false);
        setHoverSide(null);
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
        zIndex="10"
        opacity={isExiting ? 0 : opacity}
        style={{
          transform: `scale(${sizeScale * hoverScaleModifier})`,
          backdropFilter: "blur(5px)",
          transition: isDragging 
            ? "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)" 
            : "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1.6), border-radius 0.6s ease-in-out, opacity 0.5s ease-in-out, left 1s cubic-bezier(0.34, 1.56, 0.64, 1), top 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
        position="relative"
      >
        <Text
          textAlign="center"
          fontSize="2xs"
          color="gray.500"
          fontFamily="monospace"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
          maxWidth="120px"
          onClick={handleBubbleClick}
          cursor="pointer"
        >
          {content}
          
          {/* Comments section */}
          {thought.user_comments.length > 0 && (
            <Box mt={1} pt={1} borderTop="1px solid" borderColor="gray.200">
              {thought.user_comments.map((comment, index) => (
                <Text
                  key={index}
                  fontSize="2xs"
                  color="gray.400"
                  fontStyle="italic"
                  display="block"
                >
                  💬 {comment}
                </Text>
              ))}
            </Box>
          )}
        </Text>
        
        {/* Left shrink icon overlay */}
        <Fade in={hoverSide === 'left'} unmountOnExit>
          <Box 
            position="absolute" 
            left="3px" 
            top="50%" 
            transform="translateY(-50%)"
            zIndex="12"
            style={{
              transform: `translateY(-50%) scale(${1/sizeScale})`
            }}
          >
            <Minus className="lucide" style={{width: '14px', height: '14px', color: '#9CA3AF', opacity: 0.6}} />
          </Box>
        </Fade>

        {/* Right enlarge icon overlay */}
        <Fade in={hoverSide === 'right'} unmountOnExit>
          <Box 
            position="absolute" 
            right="3px" 
            top="50%" 
            transform="translateY(-50%)"
            zIndex="12"
            style={{
              transform: `translateY(-50%) scale(${1/sizeScale})`
            }}
          >
            <Plus className="lucide" style={{width: '14px', height: '14px', color: '#9CA3AF', opacity: 0.6}} />
          </Box>
        </Fade>
        
        {/* Pin button hover zone */}
        <Box
          position="absolute"
          top="-25px"
          left="-35px"
          width="50px"
          height="50px"
          zIndex="11"
          style={{
            transform: `scale(${1/sizeScale})`
          }}
          onMouseEnter={() => setShowPinButton(true)}
          onMouseLeave={() => setShowPinButton(false)}
        >
          {/* Star (pin) button */}
          <Box 
            position="absolute"
            top="13px"
            left="14px"
            opacity={thought.config.persistent || showPinButton ? opacity : 0}
            visibility={thought.config.persistent || showPinButton ? "visible" : "hidden"}
            transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
            zIndex="10"
          >
            <IconButton
              aria-label={thought.config.persistent ? "Unpin thought" : "Pin thought"}
              icon={<Pin className="lucide lucide-sm"/>}
              size="md"
              isRound
              variant="ghost"
              color={thought.config.persistent ? "red.600" : "gray.500"}
              onClick={onPinThought}
              _hover={{
                bg: "none",
                color: "red.600"
              }}
            />
          </Box>
        </Box>
        
        {/* Delete button hover zone */}
        <Box
          position="absolute"
          top="-25px"
          right="-35px"
          width="50px"
          height="50px"
          zIndex="11"
          style={{
            transform: `scale(${1/sizeScale})`
          }}
          onMouseEnter={() => setShowDeleteButton(true)}
          onMouseLeave={() => setShowDeleteButton(false)}
        >
          {/* Delete button */}
          <Box 
            position="absolute"
            top="15px"
            right="21px"
            opacity={showDeleteButton ? opacity : 0}
            visibility={showDeleteButton ? "visible" : "hidden"}
            transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
            zIndex="10"
          >
            <IconButton
              aria-label="Delete thought"
              icon={<X className="lucide lucide-md"/>}
              size="sm"
              isRound
              variant="ghost"
              color="gray.500"
              onClick={onDeleteThought}
              _hover={{
                bg: "none",
                color: "gray.600"
              }}
            />
          </Box>
        </Box>

        {/* Bottom toolbar hover zone */}
        <Box
          position="absolute"
          bottom="-40px"
          left="50%"
          transform="translateX(-50%)"
          width="160px"
          height="40px"
          zIndex="16"
          style={{
            transform: `translateX(-50%) scale(${1/sizeScale})`,
          }}
          onMouseEnter={() => setShowBottomToolbar(true)}
          onMouseLeave={() => setShowBottomToolbar(false)}
        >
          {/* Bottom Toolbar */}
          <Fade in={showBottomToolbar} unmountOnExit>
            <Box
              position="absolute"
              bottom="5px"
              left="50%"
              transform="translateX(-50%)"
              bg="white"
              borderRadius="full"
              boxShadow="0 4px 12px rgba(0,0,0,0.15)"
              border="1px solid rgba(0,0,0,0.1)"
              px={2}
              py={1}
              display="flex"
              alignItems="center"
              gap={1}
              zIndex="15"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              minW={showCommentInput ? "160px" : "auto"}
              maxW={showCommentInput ? "320px" : "auto"}
              opacity={showCommentInput ? 0.95 : 1}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Like Button */}
            <Tooltip label="Yesss" placement="bottom" hasArrow openDelay={1000} borderRadius="md">
              <IconButton
                aria-label="Like thought"
                icon={<Heart className="lucide lucide-sm" />}
                size="xs"
                variant="ghost"
                color={isHeartClicked ? "red.500" : "gray.500"}
                minW="auto"
                h="auto"
                p={1}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHeartClicked(!isHeartClicked);
                  if (!isHeartClicked) setIsThumbsDownClicked(false);
                }}
                _hover={{
                  bg: "red.50",
                  color: "red.500"
                }}
              />
            </Tooltip>
            
            {/* Dislike Button */}
            <Tooltip label="Nooo" placement="bottom" hasArrow openDelay={1000} borderRadius="md">
              <IconButton
                aria-label="Dislike thought"
                icon={<ThumbsDown className="lucide lucide-sm" />}
                size="xs"
                variant="ghost"
                color={isThumbsDownClicked ? "gray.700" : "gray.500"}
                minW="auto"
                h="auto"
                p={1}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsThumbsDownClicked(!isThumbsDownClicked);
                  if (!isThumbsDownClicked) setIsHeartClicked(false);
                }}
                _hover={{
                  bg: "gray.50",
                  color: "gray.700"
                }}
              />
            </Tooltip>
            
            {/* Elaborate Button */}
            <Tooltip label="Elaborate" placement="bottom" hasArrow openDelay={1000} borderRadius="md">
              <IconButton
                aria-label="Elaborate thought"
                icon={<Brain className="lucide lucide-sm" />}
                size="xs"
                variant="ghost"
                color="gray.500"
                minW="auto"
                h="auto"
                p={1}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Elaborating thought: ${thoughtId}`);
                }}
                _hover={{
                  bg: "purple.50",
                  color: "purple.500"
                }}
              />
            </Tooltip>
            
            {/* Burst Button */}
            <Tooltip label="Burst" placement="bottom" hasArrow openDelay={1000} borderRadius="md">
              <IconButton
                aria-label="Burst thought"
                icon={<Bubbles className="lucide lucide-sm" />}
                size="xs"
                variant="ghost"
                color="gray.500"
                minW="auto"
                h="auto"
                p={1}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Bursting thought: ${thoughtId}`);
                }}
                _hover={{
                  bg: "blue.50",
                  color: "blue.500"
                }}
              />
            </Tooltip>

            {/* Comment Button */}
            <Tooltip label="Comment" placement="bottom" hasArrow openDelay={1000} borderRadius="md">
              <IconButton
                aria-label="Comment on thought"
                icon={<MessageCircle className="lucide lucide-sm" />}
                size="xs"
                variant="ghost"
                color={showCommentInput ? "yellow.600" : "gray.500"}
                minW="auto"
                h="auto"
                p={1}
                onClick={onCommentClick}
                _hover={{
                  bg: "yellow.50",
                  color: "yellow.600"
                }}
              />
            </Tooltip>
            
            {/* Comment Input - appears when showCommentInput is true */}
            <Fade in={showCommentInput} unmountOnExit transition={{ enter: { duration: 0.35 }, exit: { duration: 0.2 } }}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                ml={1}
                flex={1}
                minW="0"
                opacity={showCommentInput ? 1 : 0}
                transition="opacity 0.3s ease-in-out"
              >
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={commentText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: '#374151',
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '70px'
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      onSaveComment(e as any);
                    } else if (e.key === 'Escape') {
                      onCancelComment(e as any);
                    }
                  }}
                  onFocus={(e) => e.target.style.outline = 'none'}
                />
                <IconButton
                  aria-label="Save comment"
                  icon={<Box as="span" fontSize="xs">✓</Box>}
                  size="xs"
                  variant="ghost"
                  color="green.500"
                  minW="auto"
                  h="auto"
                  p={1}
                  onClick={onSaveComment}
                  _hover={{
                    bg: "green.50",
                    color: "green.600"
                  }}
                />
                <IconButton
                  aria-label="Cancel comment"
                  icon={<Box as="span" fontSize="xs">✕</Box>}
                  size="xs"
                  variant="ghost"
                  color="red.500"
                  minW="auto"
                  h="auto"
                  p={1}
                  onClick={onCancelComment}
                  _hover={{
                    bg: "red.50",
                    color: "red.600"
                  }}
                />
              </Box>
            </Fade>
           </Box>
         </Fade>
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

                {/* Heart icon in bottom left when clicked */}
        <Fade in={isHeartClicked} unmountOnExit>
          <Box
            position="absolute"
            bottom="-4px"
            left="-4px"
            color="red.500"
            style={{
              transform: `scale(${1/sizeScale})`
            }}
            transition="transform 0.2s ease-in-out"
          >
            <Heart className="lucide lucide-sm" style={{fill: '#fca5a5', stroke: '#ef4444'}} />
          </Box>
        </Fade>

        {/* Thumbs down icon in bottom left when clicked */}
        <Fade in={isThumbsDownClicked} unmountOnExit>
          <Box
            position="absolute"
            bottom="-4px"
            left="-4px"
            color="gray.700"
            style={{
              transform: `scale(${1/sizeScale})`
            }}
            transition="transform 0.2s ease-in-out"
          >
            <ThumbsDown className="lucide lucide-sm" />
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