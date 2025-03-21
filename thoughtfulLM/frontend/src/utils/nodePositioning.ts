import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { ThoughtNode } from '../store/thoughtStore';


// Constants for node dimensions and spacing
export const NODE_DIMENSIONS = {
  HEIGHT: 80,
  WIDTH: 150,
  VERTICAL_OFFSET: 0,
  HORIZONTAL_SPACING: 5
};

// Position strategy interface
export interface PositioningStrategy {
  name: string;
  calculatePosition: (
    textInputNode: ReactFlowNode, 
    existingNodes: ThoughtNode[]
  ) => XYPosition;
}

/**
 * Strategy that places thoughts randomly either above or to the right of the text input
 * with overlap avoidance
 */
export const aboveInputStrategy: PositioningStrategy = {
  name: 'aboveInput',
  calculatePosition: (textInputNode, existingNodes) => {
    if (!textInputNode) {
      return { x: 300, y: 300 }; // Fallback position
    }

    // In ReactFlow, node position is the top-left corner
    const inputPosition = textInputNode.position;
    const inputWidth = textInputNode.width || 400; // Use node width or default if undefined
    const inputHeight = textInputNode.height || 150; // Use node height or default if undefined
    
    // Calculate the center of the input node
    const inputCenterX = inputPosition.x + (inputWidth / 2);
    
    // Randomly decide whether to place the thought above or to the right
    // Improved positioning balance logic with wider detection area
    const existingAbove = existingNodes.filter(node => 
      node.position.y < inputPosition.y && 
      node.position.x > inputPosition.x - 150 && 
      node.position.x < inputPosition.x + inputWidth + 150
    ).length;
    
    const existingRight = existingNodes.filter(node => 
      node.position.x > inputPosition.x + inputWidth &&
      node.position.y > inputPosition.y - 100 &&
      node.position.y < inputPosition.y + inputHeight + 100
    ).length;
    
    // More balanced distribution logic
    let placeAbove;
    
    if (existingAbove === 0 && existingRight === 0) {
      // If no nodes exist yet, 70% chance to go above for a more natural look
      placeAbove = Math.random() < 0.7;
    } else {
      // Stronger bias toward the area with fewer nodes
      placeAbove = existingAbove <= existingRight ? 
        Math.random() > 0.25 :  // 75% chance to go above if fewer nodes are above
        Math.random() > 0.75;   // 25% chance to go above if more nodes are above
    }
    
    let position: XYPosition;
    let attempts = 0;
    const maxAttempts = 50;  // Increase max attempts to find a good position
    
    // Try to find a non-overlapping position
    do {
      // Add some randomness to spacing with wider range for more natural look
      const randomVerticalOffset = Math.random() * 40 - 15;    // -15 to +25px
      const randomHorizontalOffset = Math.random() * 60 - 20;  // -20 to +40px
      
      if (placeAbove) {
        // Define boundaries for above placement with wider range
        const maxThoughts = 5;
        const totalWidth = (maxThoughts * NODE_DIMENSIONS.WIDTH) + ((maxThoughts - 1) * NODE_DIMENSIONS.HORIZONTAL_SPACING);
        const leftBoundary = inputCenterX - (totalWidth / 2);
        const rightBoundary = inputCenterX + (totalWidth / 2) - NODE_DIMENSIONS.WIDTH;
        
        // Random position above the input with randomized distance
        const x = leftBoundary + Math.random() * (rightBoundary - leftBoundary);
        const y = inputPosition.y - NODE_DIMENSIONS.VERTICAL_OFFSET - NODE_DIMENSIONS.HEIGHT + randomVerticalOffset;
        position = { x, y };
      } else {
        // Define boundaries for right placement with randomized distance
        const x = inputPosition.x + inputWidth + NODE_DIMENSIONS.HORIZONTAL_SPACING + randomHorizontalOffset;
        
        // Random position vertically aligned with the input
        const topBoundary = inputPosition.y - NODE_DIMENSIONS.HEIGHT / 2; // Slightly above
        const bottomBoundary = inputPosition.y + inputHeight - NODE_DIMENSIONS.HEIGHT / 2; // Slightly below
        const y = topBoundary + Math.random() * (bottomBoundary - topBoundary);
        position = { x, y };
      }
      
      attempts++;
      
      // Break after max attempts to avoid infinite loops
      if (attempts >= maxAttempts) {
        // Try different positions around the input in sequence instead of immediately going to left
        const positionOptions = [
          // First try top-center with slight offset
          { 
            x: inputCenterX - (NODE_DIMENSIONS.WIDTH / 2) + (Math.random() * 60 - 30),
            y: inputPosition.y - NODE_DIMENSIONS.HEIGHT - 20 - (Math.random() * 15)
          },
          // Then try right-middle with offset
          {
            x: inputPosition.x + inputWidth + 10 + (Math.random() * 20),
            y: inputPosition.y + (inputHeight / 2) - (NODE_DIMENSIONS.HEIGHT / 2) + (Math.random() * 30 - 15)
          },
          // Only as last resort, try left side
          {
            x: inputPosition.x - NODE_DIMENSIONS.WIDTH - (Math.random() * 10),
            y: inputPosition.y + (Math.random() * inputHeight) - NODE_DIMENSIONS.HEIGHT
          }
        ];
        
        // Try each position option in sequence until we find one without overlap
        for (const option of positionOptions) {
          if (!hasOverlap(option, existingNodes)) {
            position = option;
            break;
          }
        }
        
        // If all else fails, use the last option with some randomness
        if (!position || hasOverlap(position, existingNodes)) {
          position = positionOptions[Math.floor(Math.random() * positionOptions.length)];
        }
        
        break;
      }
    } while (hasOverlap(position, existingNodes));
    
    return position;
  }
};

/**
 * Main function to calculate thought node position using a selected strategy
 */
export const calculateThoughtNodePosition = (
  textInputNode: ReactFlowNode,
  existingNodes: ThoughtNode[],
  strategy: PositioningStrategy = aboveInputStrategy
): XYPosition => {
  return strategy.calculatePosition(textInputNode, existingNodes);
};

// Export available strategies for easier access
export const positioningStrategies = {
  aboveInput: aboveInputStrategy,
};

/**
 * Checks if a potential position would overlap with any existing thought nodes
 * Allow a small buffer for overlap
 */
const hasOverlap = (position: XYPosition, existingNodes: ThoughtNode[]): boolean => {
  if (!existingNodes || existingNodes.length === 0) {
    return false;
  }
  
  const buffer = 0.20;   // Reduce buffer from 0.30 to 0.20 to allow closer placement
  return existingNodes.some((node) => 
    Math.abs(position.x - node.position.x) < NODE_DIMENSIONS.WIDTH + (NODE_DIMENSIONS.WIDTH * buffer) &&
    Math.abs(position.y - node.position.y) < NODE_DIMENSIONS.HEIGHT + (NODE_DIMENSIONS.HEIGHT * buffer)
  );
}; 
