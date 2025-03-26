import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { ThoughtNode } from '../hooks/useThoughtNodes';
import { useBoundsStore } from '../store/boundsStore';

// Constants for node dimensions
export const NODE_DIMENSIONS = {
  HEIGHT: 50,
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
 * Calculate the centroid (center of mass) of existing nodes
 */
const calculateCentroid = (existingNodes: ThoughtNode[]): XYPosition => {
  if (!existingNodes || existingNodes.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const sum = existingNodes.reduce(
    (acc, node) => {
      return {
        x: acc.x + node.position.x,
        y: acc.y + node.position.y
      };
    },
    { x: 0, y: 0 }
  );
  
  return {
    x: sum.x / existingNodes.length,
    y: sum.y / existingNodes.length
  };
};

/**
 * Find a balanced position for a new node based on existing nodes
 */
const findBalancedPosition = (
  bounds: Bounds,
  existingNodes: ThoughtNode[]
): XYPosition => {
  const { topLeft, bottomRight } = bounds;
  
  // If no existing nodes, place in the center of bounds
  if (!existingNodes || existingNodes.length === 0) {
    return {
      x: topLeft.x + (bottomRight.x - topLeft.x) / 2 - NODE_DIMENSIONS.WIDTH / 2,
      y: 0
    };
  }
  
  // For a single existing node, place adjacent to it
  if (existingNodes.length === 1) {
    const node = existingNodes[0];
    const spacing = 3; // Distance between nodes (reduced from 30)
    
    // Try positions in different directions (right, bottom, left, top)
    const candidatePositions = [
      { x: node.position.x + NODE_DIMENSIONS.WIDTH + spacing, y: node.position.y },
      { x: node.position.x, y: node.position.y + NODE_DIMENSIONS.HEIGHT + spacing },
      { x: node.position.x - NODE_DIMENSIONS.WIDTH - spacing, y: node.position.y },
      { x: node.position.x, y: node.position.y - NODE_DIMENSIONS.HEIGHT - spacing }
    ];
    
    // Filter positions that are within bounds
    const validPositions = candidatePositions.filter(pos => 
      pos.x >= topLeft.x && 
      pos.x + NODE_DIMENSIONS.WIDTH <= bottomRight.x &&
      pos.y >= topLeft.y && 
      pos.y + NODE_DIMENSIONS.HEIGHT <= bottomRight.y
    );
    
    return validPositions.length > 0 ? validPositions[0] : candidatePositions[0];
  }
  
  // For multiple nodes, use more advanced positioning
  const centroid = calculateCentroid(existingNodes);
  
  // Find the node furthest from the centroid
  let maxDistance = 0;
  let furthestNode = existingNodes[0];
  
  existingNodes.forEach(node => {
    const distance = Math.sqrt(
      Math.pow(node.position.x - centroid.x, 2) + 
      Math.pow(node.position.y - centroid.y, 2)
    );
    
    if (distance > maxDistance) {
      maxDistance = distance;
      furthestNode = node;
    }
  });
  
  // Calculate angle from centroid to furthest node
  const angleToFurthest = Math.atan2(
    furthestNode.position.y - centroid.y,
    furthestNode.position.x - centroid.x
  );
  
  // Place new node on the opposite side of the centroid
  const oppositeAngle = angleToFurthest + Math.PI;
  const distance = Math.min(
    maxDistance * 0.7, // Reduce distance to 70% of the original distance
    NODE_DIMENSIONS.WIDTH * 1.5  // Reduced from 2x width to 1.5x width
  );
  
  const newPosition = {
    x: centroid.x + Math.cos(oppositeAngle) * distance,
    y: centroid.y + Math.sin(oppositeAngle) * distance
  };
  
  // Ensure position is within bounds
  const adjustedPosition = {
    x: Math.max(topLeft.x, Math.min(bottomRight.x - NODE_DIMENSIONS.WIDTH, newPosition.x)),
    y: Math.max(topLeft.y, Math.min(bottomRight.y - NODE_DIMENSIONS.HEIGHT, newPosition.y))
  };
  
  return adjustedPosition;
};

/**
 * Strategy that places thoughts in a balanced way within a defined rectangular area
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
    
    // Define placement area with some safeguards to ensure minimum viable area
    const minX = topLeft.x;
    const maxX = Math.max(bottomRight.x - NODE_DIMENSIONS.WIDTH, minX + NODE_DIMENSIONS.WIDTH);
    const minY = topLeft.y;
    const maxY = Math.max(bottomRight.y - NODE_DIMENSIONS.HEIGHT, minY + NODE_DIMENSIONS.HEIGHT);
    
    // Only use fallback if we have truly invalid bounds (zero or negative area)
    if (maxX <= minX || maxY <= minY) {
      console.warn('Invalid bounds provided for node positioning, using fallback position');
      return { x: 300, y: 300 }; // Fallback position
    }
    
    // Calculate balanced position based on existing nodes
    let position = findBalancedPosition(bounds, existingNodes);
    
    // Check if the balanced position overlaps with existing nodes
    if (!hasOverlap(position, existingNodes)) {
      return position;
    }
    
    // If balanced position overlaps, try angular positions around the centroid
    const centroid = calculateCentroid(existingNodes);
    const baseDistance = NODE_DIMENSIONS.WIDTH + 3; // Reduced from 20 to 10
    let attempts = 0;
    const maxAttempts = 12; // Try 12 different angles around the centroid
    
    while (attempts < maxAttempts) {
      const angle = (Math.PI * 2 / maxAttempts) * attempts;
      const candidatePosition = {
        x: centroid.x + Math.cos(angle) * baseDistance,
        y: centroid.y + Math.sin(angle) * baseDistance
      };
      
      // Adjust position to stay within bounds
      const adjustedPosition = {
        x: Math.max(minX, Math.min(maxX, candidatePosition.x)),
        y: Math.max(minY, Math.min(maxY, candidatePosition.y))
      };
      
      if (!hasOverlap(adjustedPosition, existingNodes)) {
        return adjustedPosition;
      }
      
      attempts++;
    }
    
    // If all else fails, fall back to grid approach and minimal overlap
    const gridPositions = generateGridPositions(bounds, existingNodes);
    
    // Try each position in the grid until we find one without overlap
    for (const gridPos of gridPositions) {
      if (!hasOverlap(gridPos, existingNodes)) {
        return gridPos;
      }
    }
    
    // Last resort: position with minimal overlap
    return findPositionWithMinimalOverlap(bounds, existingNodes);
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
  
  // Node spacing for grid positions
  const nodeSpacing = 3; // Reduced from 15 to 8 for closer positioning
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
  
  // Use same buffer as hasOverlap for consistency
  const buffer = 0.05;
  
  return existingNodes.filter(node => 
    Math.abs(position.x - node.position.x) < NODE_DIMENSIONS.WIDTH + (NODE_DIMENSIONS.WIDTH * buffer) &&
    Math.abs(position.y - node.position.y) < NODE_DIMENSIONS.HEIGHT + (NODE_DIMENSIONS.HEIGHT * buffer)
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
export const createBoundsAboveNode = (node: ReactFlowNode): Bounds => {
  if (!node) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeWidth = node.width || 500;
  const nodeHeight = node.height || 200;

  // Width is 120% of the node width
  const boundsWidth = nodeWidth * 1.2;
  // Height is 3 times the thought node height
  const boundsHeight =  nodeHeight;
  // X offset to center the bounds above the node (accounts for the extra width)
  const xOffset = (boundsWidth - nodeWidth) / 2;
  // Y is 5pt above the input node upper bound
  const boundsY = nodeY - boundsHeight - 5;
  
  const bounds = {
    topLeft: { x: nodeX - xOffset, y: boundsY },
    topRight: { x: nodeX + nodeWidth + xOffset, y: boundsY },
    bottomLeft: { x: nodeX - xOffset, y: boundsY + boundsHeight },
    bottomRight: { x: nodeX + nodeWidth + xOffset, y: boundsY + boundsHeight }
  };

  return bounds;
};

/**
 * Creates a bounded area to the right of a given input node
 */
export const createBoundsRightOfNode = (node: ReactFlowNode): Bounds => {
  if (!node) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeWidth = node.width || 500;
  const nodeHeight = node.height || 200;

  // Width is equivalent to the node height (for vertical positioning)
  const boundsWidth = nodeHeight;
  // Height is 120% of the node height
  const boundsHeight = nodeHeight * 1.2;
  // X is 5pt to the right of the input node right bound
  const boundsX = nodeX + nodeWidth + 5;
  // Y offset to center the bounds to the right of the node (accounts for the extra height)
  const yOffset = (boundsHeight - nodeHeight) / 2;
  
  const bounds = {
    topLeft: { x: boundsX, y: nodeY - yOffset },
    topRight: { x: boundsX + boundsWidth, y: nodeY - yOffset },
    bottomLeft: { x: boundsX, y: nodeY + nodeHeight + yOffset },
    bottomRight: { x: boundsX + boundsWidth, y: nodeY + nodeHeight + yOffset }
  };

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
  
  // Fix buffer to 5% to reduce overlap
  const buffer = 0.05;
  
  return existingNodes.some((node) => 
    Math.abs(position.x - node.position.x) < NODE_DIMENSIONS.WIDTH + (NODE_DIMENSIONS.WIDTH * buffer) &&
    Math.abs(position.y - node.position.y) < NODE_DIMENSIONS.HEIGHT + (NODE_DIMENSIONS.HEIGHT * buffer)
  );
}; 
