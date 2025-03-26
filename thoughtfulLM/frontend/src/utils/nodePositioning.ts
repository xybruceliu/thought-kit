import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { ThoughtNode } from '../hooks/useThoughtNodes';
import { useBoundsStore } from '../store/boundsStore';

// Constants for node dimensions
export const NODE_DIMENSIONS = {
  HEIGHT: 80,
  WIDTH: 150
};

// Define Bounds Type (4 points of a rectangular area)
export type Bounds = {
  topLeft: XYPosition;
  topRight: XYPosition;
  bottomLeft: XYPosition;
  bottomRight: XYPosition;
};

// Position strategy interface
export interface PositioningStrategy {
  name: string;
  calculatePosition: (
    bounds: Bounds,
    existingNodes: ThoughtNode[]
  ) => XYPosition;
}

/**
 * Strategy that places thoughts randomly within a defined rectangular area
 * with overlap avoidance
 */
export const boundedAreaStrategy: PositioningStrategy = {
  name: 'boundedArea',
  calculatePosition: (bounds, existingNodes) => {
    // Fallback position if bounds not provided correctly
    if (!bounds) {
      return { x: 300, y: 300 };
    }

    // Extract bounds information
    const { topLeft, bottomRight } = bounds;
    
    // Define placement area
    const minX = topLeft.x;
    const maxX = bottomRight.x - NODE_DIMENSIONS.WIDTH; // Adjust for node width
    const minY = topLeft.y;
    const maxY = bottomRight.y - NODE_DIMENSIONS.HEIGHT; // Adjust for node height
    
    // Ensure valid area
    if (maxX <= minX || maxY <= minY) {
      console.warn('Invalid bounds provided for node positioning');
      return { x: 300, y: 300 }; // Fallback position
    }
    
    let position: XYPosition;
    let attempts = 0;
    const maxAttempts = 50;
    
    // Try to find a non-overlapping position
    do {
      // Generate random position within the bounds
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      position = { x, y };
      
      attempts++;
      
      // Break after max attempts to avoid infinite loops
      if (attempts >= maxAttempts) {
        // Try a grid-based approach as backup
        const gridPositions = generateGridPositions(bounds, existingNodes);
        
        // Try each position in the grid until we find one without overlap
        for (const gridPos of gridPositions) {
          if (!hasOverlap(gridPos, existingNodes)) {
            position = gridPos;
            break;
          }
        }
        
        // If all else fails, use a position with minimal overlap
        if (!position || hasOverlap(position, existingNodes)) {
          position = findPositionWithMinimalOverlap(bounds, existingNodes);
        }
        
        break;
      }
    } while (hasOverlap(position, existingNodes));
    
    return position;
  }
};

/**
 * Generate a set of grid positions within the bounds
 */
const generateGridPositions = (bounds: Bounds, existingNodes: ThoughtNode[]): XYPosition[] => {
  const { topLeft, bottomRight } = bounds;
  const positions: XYPosition[] = [];
  
  // Calculate area width and height
  const areaWidth = bottomRight.x - topLeft.x;
  const areaHeight = bottomRight.y - topLeft.y;
  
  // Calculate how many nodes can fit in the area
  const nodeSpacing = 3;  
  const cols = Math.max(1, Math.floor(areaWidth / (NODE_DIMENSIONS.WIDTH + nodeSpacing)));
  const rows = Math.max(1, Math.floor(areaHeight / (NODE_DIMENSIONS.HEIGHT + nodeSpacing)));
  
  // Create a grid of positions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = topLeft.x + col * (NODE_DIMENSIONS.WIDTH + nodeSpacing);
      const y = topLeft.y + row * (NODE_DIMENSIONS.HEIGHT + nodeSpacing);
      
      // Add some small random offset for a more natural look
      const randomX = x + (Math.random() * 10 - 5);
      const randomY = y + (Math.random() * 10 - 5);
      
      positions.push({ x: randomX, y: randomY });
    }
  }
  
  // Shuffle the positions for random selection
  return positions.sort(() => Math.random() - 0.5);
};

/**
 * Find a position with minimal overlap as a last resort
 */
const findPositionWithMinimalOverlap = (bounds: Bounds, existingNodes: ThoughtNode[]): XYPosition => {
  const { topLeft, bottomRight } = bounds;
  
  // Generate some candidate positions
  const candidates: XYPosition[] = [];
  
  // Create a coarse grid of positions
  const cols = 5;
  const rows = 5;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = topLeft.x + col * ((bottomRight.x - topLeft.x) / cols);
      const y = topLeft.y + row * ((bottomRight.y - topLeft.y) / rows);
      candidates.push({ x, y });
    }
  }
  
  // Find position with minimal overlap
  let bestPosition = candidates[0];
  let minOverlapCount = countOverlaps(bestPosition, existingNodes);
  
  for (const position of candidates) {
    const overlapCount = countOverlaps(position, existingNodes);
    if (overlapCount < minOverlapCount) {
      minOverlapCount = overlapCount;
      bestPosition = position;
      
      // Break early if we find a position with no overlap
      if (minOverlapCount === 0) break;
    }
  }
  
  return bestPosition;
};

/**
 * Count how many nodes overlap with a position
 */
const countOverlaps = (position: XYPosition, existingNodes: ThoughtNode[]): number => {
  if (!existingNodes || existingNodes.length === 0) {
    return 0;
  }
  
  return existingNodes.filter(node => 
    Math.abs(position.x - node.position.x) < NODE_DIMENSIONS.WIDTH &&
    Math.abs(position.y - node.position.y) < NODE_DIMENSIONS.HEIGHT
  ).length;
};

/**
 * Calculate node position using the current bounds from the global store
 * Primary method for positioning nodes in the application
 */
export const calculateNodePosition = (
  existingNodes: ThoughtNode[],
  strategy: PositioningStrategy = boundedAreaStrategy
): XYPosition => {
  const bounds = useBoundsStore.getState().getBounds();
  return strategy.calculatePosition(bounds, existingNodes);
};

// Export available strategies for easier access
export const positioningStrategies = {
  boundedArea: boundedAreaStrategy,
};

/**
 * Creates a bounded area above a given input node and updates the global bounds store
 */
export const setBoundsAboveNode = (node: ReactFlowNode): Bounds => {
  if (!node) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    useBoundsStore.getState().setBounds(defaultBounds);
    return defaultBounds;
  }
  
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeWidth = node.width || 400;
  
  // Calculate bounds dimensions
  // Width is 120% of the node width
  const boundsWidth = nodeWidth * 1.2;
  // Height is 3 times the thought node height
  const boundsHeight = NODE_DIMENSIONS.HEIGHT * 2;
  // X offset to center the bounds above the node (accounts for the extra width)
  const xOffset = (boundsWidth - nodeWidth) / 2;
  // Y is 5pt above the node
  const boundsY = nodeY - boundsHeight - 5;
  
  const bounds = {
    topLeft: { x: nodeX - xOffset, y: boundsY },
    topRight: { x: nodeX + nodeWidth + xOffset, y: boundsY },
    bottomLeft: { x: nodeX - xOffset, y: boundsY + boundsHeight },
    bottomRight: { x: nodeX + nodeWidth + xOffset, y: boundsY + boundsHeight }
  };
  
  // Update the store
  useBoundsStore.getState().setBounds(bounds);
  
  return bounds;
};

/**
 * Sets custom bounds and updates the global store
 */
export const setBounds = (bounds: Bounds): void => {
  useBoundsStore.getState().setBounds(bounds);
};

/**
 * Checks if a potential position would overlap with any existing thought nodes
 */
const hasOverlap = (position: XYPosition, existingNodes: ThoughtNode[]): boolean => {
  if (!existingNodes || existingNodes.length === 0) {
    return false;
  }
  
  const buffer = 0.20;   // 20% buffer for overlap detection
  return existingNodes.some((node) => 
    Math.abs(position.x - node.position.x) < NODE_DIMENSIONS.WIDTH + (NODE_DIMENSIONS.WIDTH * buffer) &&
    Math.abs(position.y - node.position.y) < NODE_DIMENSIONS.HEIGHT + (NODE_DIMENSIONS.HEIGHT * buffer)
  );
}; 
