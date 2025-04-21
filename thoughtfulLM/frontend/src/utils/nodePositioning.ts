import { XYPosition, Node as ReactFlowNode } from 'reactflow';
import { useBoundsStore } from '../store/boundsStore';
import { useSettingsStore } from '../store/settingsStore';
import { NodeData } from '../store/nodeStore';

// Type alias for thought node with proper data type
type ThoughtNode = ReactFlowNode<NodeData>;

// Constants for node dimensions
export const THOUGHT_NODE_DIMENSIONS = {
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
  calculateNodePosition: (
    bounds: Bounds,
    existingNodes: ThoughtNode[],
    sidePreference?: 'bottom' | 'left' | 'top' | 'right'
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
 * Strategy that places thoughts in a balanced way within a defined rectangular area
 * with overlap avoidance
 */
export const boundedAreaStrategy: PositioningStrategy = {
  name: 'boundedArea',
  calculateNodePosition: (bounds, existingNodes, sidePreference) => {
    // If no existing nodes, position with more variability across the bounds
    if (!existingNodes || existingNodes.length === 0) {
      const boundsWidth = bounds.topRight.x - bounds.topLeft.x;
      const boundsHeight = bounds.bottomLeft.y - bounds.topLeft.y;
      
      // Determine which zone to place the initial node based on preference or random if no preference
      let xPercentage, yPercentage;
      
      if (sidePreference) {
        // Apply preference with some variability
        switch (sidePreference) {
          case 'top':
            xPercentage = 0.3 + Math.random() * 0.4; // 30-70% horizontally
            yPercentage = 0.1 + Math.random() * 0.3; // 10-40% from top
            break;
          case 'right':
            xPercentage = 0.6 + Math.random() * 0.3; // 60-90% horizontally
            yPercentage = 0.3 + Math.random() * 0.4; // 30-70% vertically
            break;
          case 'bottom':
            xPercentage = 0.3 + Math.random() * 0.4; // 30-70% horizontally
            yPercentage = 0.6 + Math.random() * 0.3; // 60-90% from top
            break;
          case 'left':
            xPercentage = 0.1 + Math.random() * 0.3; // 10-40% horizontally
            yPercentage = 0.3 + Math.random() * 0.4; // 30-70% vertically
            break;
        }
      } else {
        console.log("No side preference, more randomized placement across the entire area");
        // No preference - more randomized placement across the entire area
        // Avoid extreme edges with some padding (15%)
        xPercentage = 0.15 + Math.random() * 0.7; // 15-85% horizontally
        yPercentage = 0.15 + Math.random() * 0.7; // 15-85% vertically
      }
      
      // Calculate position using percentages of the bounds
      const posX = bounds.topLeft.x + (boundsWidth * xPercentage);
      const posY = bounds.topLeft.y + (boundsHeight * yPercentage);
      
      // Add a small additional randomness for natural feeling
      const randomOffsetX = (Math.random() - 0.5) * 15;
      const randomOffsetY = (Math.random() - 0.5) * 15;
      
      return { 
        x: posX + randomOffsetX, 
        y: posY + randomOffsetY 
      };
    }
    
    // Calculate bounds dimensions
    const boundsWidth = bounds.topRight.x - bounds.topLeft.x;
    const boundsHeight = bounds.bottomLeft.y - bounds.topLeft.y;
    
    // Divide the area into a grid (4x4 grid for simplicity)
    const gridCols = 4;
    const gridRows = 4;
    const cellWidth = boundsWidth / gridCols;
    const cellHeight = boundsHeight / gridRows;
    
    // Helper to calculate overlap percentage
    const calculateOverlapPercentage = (position: XYPosition, node: ThoughtNode): number => {
      // Calculate intersection dimensions
      const nodeWidth = THOUGHT_NODE_DIMENSIONS.WIDTH;
      const nodeHeight = THOUGHT_NODE_DIMENSIONS.HEIGHT;
      
      const dx = Math.min(position.x + nodeWidth, node.position.x + nodeWidth) - 
                Math.max(position.x, node.position.x);
      const dy = Math.min(position.y + nodeHeight, node.position.y + nodeHeight) - 
                Math.max(position.y, node.position.y);
                
      // If no overlap, return 0
      if (dx <= 0 || dy <= 0) return 0;
      
      // Calculate overlap area and percentage
      const overlapArea = dx * dy;
      const nodeArea = nodeWidth * nodeHeight;
      return (overlapArea / nodeArea) * 100;
    };
    
    // Helper to check total overlap with all nodes
    const getTotalOverlap = (position: XYPosition): number => {
      return existingNodes.reduce((total, node) => {
        return total + calculateOverlapPercentage(position, node);
      }, 0);
    };
    
    // Determine cell order based on preference
    let cellOrder: number[] = [];
    const topCells = [0, 1, 2, 3];
    const rightCells = [3, 7, 11, 15];
    const bottomCells = [12, 13, 14, 15];
    const leftCells = [0, 4, 8, 12];
    const centerCells = [5, 6, 9, 10];
    
    // Order cells based on preference
    if (sidePreference === 'top') {
      cellOrder = [...topCells, ...centerCells, ...leftCells, ...rightCells, ...bottomCells];
    } else if (sidePreference === 'right') {
      cellOrder = [...rightCells, ...centerCells, ...topCells, ...bottomCells, ...leftCells];
    } else if (sidePreference === 'bottom') {
      cellOrder = [...bottomCells, ...centerCells, ...leftCells, ...rightCells, ...topCells];
    } else if (sidePreference === 'left') {
      cellOrder = [...leftCells, ...centerCells, ...topCells, ...bottomCells, ...rightCells];
    } else {
      // Default to a balanced approach
      cellOrder = [...centerCells, ...topCells, ...rightCells, ...bottomCells, ...leftCells];
    }
    
    // Add remaining cells
    for (let i = 0; i < gridRows * gridCols; i++) {
      if (!cellOrder.includes(i)) {
        cellOrder.push(i);
      }
    }
    
    // Try positions in order of preference
    let bestPosition: XYPosition | null = null;
    let bestOverlap = Infinity;
    
    for (const cellIndex of cellOrder) {
      const row = Math.floor(cellIndex / gridCols);
      const col = cellIndex % gridCols;
      
      // Calculate base position in this cell
      const baseX = bounds.topLeft.x + (col * cellWidth);
      const baseY = bounds.topLeft.y + (row * cellHeight);
      
      // Try several positions within the cell with randomness
      for (let attempt = 0; attempt < 3; attempt++) {
        // Add randomness within the cell
        const randomX = Math.random() * cellWidth * 0.8;
        const randomY = Math.random() * cellHeight * 0.8;
        
        const position = {
          x: baseX + randomX,
          y: baseY + randomY
        };
        
        // Check if position is within bounds
        if (
          position.x < bounds.topLeft.x || 
          position.x > bounds.topRight.x - THOUGHT_NODE_DIMENSIONS.WIDTH ||
          position.y < bounds.topLeft.y || 
          position.y > bounds.bottomLeft.y - THOUGHT_NODE_DIMENSIONS.HEIGHT
        ) {
          continue;
        }
        
        // Calculate total overlap
        const overlap = getTotalOverlap(position);
        
        // If no overlap, use this position immediately
        if (overlap === 0) {
          return position;
        }
        
        // If better than previous best and under 10% overlap, update best position
        if (overlap < bestOverlap && overlap <= 10) {
          bestPosition = position;
          bestOverlap = overlap;
        }
      }
    }
    
    // If we found a position with acceptable overlap, return it
    if (bestPosition) {
      return bestPosition;
    }
    
    // Fallback: use centroid with offset to avoid direct overlap
    const centroid = calculateCentroid(existingNodes);
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = THOUGHT_NODE_DIMENSIONS.WIDTH * 0.8;
    
    return {
      x: centroid.x + Math.cos(randomAngle) * distance,
      y: centroid.y + Math.sin(randomAngle) * distance
    };
  }
};


// Export available strategies for easier access
export const positioningStrategies = {
  boundedArea: boundedAreaStrategy,
};

/**
 * Get dimensions and position for either a ReactFlow node or a DOM element
 */
const getElementDimensions = (element: ReactFlowNode | HTMLElement): { x: number, y: number, width: number, height: number } => {
  if (!element) {
    return { x: 0, y: 0, width: 500, height: 200 };
  }
  
  // If it's a ReactFlow node
  if ('position' in element) {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.width || 500,
      height: element.height || 200
    };
  }
  
  // If it's a DOM element
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
};

/**
 * Creates a bounded area above a given element and updates the global bounds store
 */
export const createBoundsAboveNode = (element: ReactFlowNode | HTMLElement, showVisually?: boolean): Bounds => {
  if (!element) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = getElementDimensions(element);

  // Width is 120% of the node width
  const boundsWidth = nodeWidth * 1.2;
  // Height is 3 times the thought node height
  const boundsHeight = 200;
  // X offset to center the bounds above the node (accounts for the extra width)
  const xOffset = (boundsWidth - nodeWidth) / 2;
  // Y is 5pt above the input node upper bound
  const boundsY = nodeY - boundsHeight - 10;
  
  const bounds = {
    topLeft: { x: nodeX - xOffset, y: boundsY },
    topRight: { x: nodeX + nodeWidth + xOffset, y: boundsY },
    bottomLeft: { x: nodeX - xOffset, y: boundsY + boundsHeight },
    bottomRight: { x: nodeX + nodeWidth + xOffset, y: boundsY + boundsHeight }
  };

  // Use the debug mode setting if showVisually is not explicitly provided
  if (showVisually === undefined) {
    showVisually = useSettingsStore.getState().debugMode;
  }

  // Update the bounds in the store
  useBoundsStore.getState().setBounds(bounds, showVisually);

  return bounds;
};

/**
 * Creates a bounded area to the right of a given element
 */
export const createBoundsRightOfNode = (element: ReactFlowNode | HTMLElement, showVisually?: boolean): Bounds => {
  if (!element) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = getElementDimensions(element);

  // Width is 50% of the node width
  const boundsWidth = nodeWidth * 0.8;
  const boundsHeight = nodeHeight;
  const boundsX = nodeX + nodeWidth + 10;
  const boundsY = nodeY + (nodeHeight / 2) - (boundsHeight / 2);
  
  const bounds = {
    topLeft: { x: boundsX, y: boundsY },
    topRight: { x: boundsX + boundsWidth, y: boundsY },
    bottomLeft: { x: boundsX, y: boundsY + boundsHeight },
    bottomRight: { x: boundsX + boundsWidth, y: boundsY + boundsHeight }
  };
  
  // Use the debug mode setting if showVisually is not explicitly provided
  if (showVisually === undefined) {
    showVisually = useSettingsStore.getState().debugMode;
  }

  // Update the bounds in the store  
  useBoundsStore.getState().setBounds(bounds, showVisually);
  
  return bounds;
};

/**
 * Creates a bounded area below a given element and updates the global bounds store
 */
export const createBoundsBelowNode = (element: ReactFlowNode | HTMLElement, showVisually?: boolean): Bounds => {
  if (!element) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = getElementDimensions(element);

  // Width is 120% of the node width
  const boundsWidth = nodeWidth * 1.2;
  // Height is 0.7 times the thought node height (matching the above pattern)
  const boundsHeight = nodeHeight * 0.7;
  // X offset to center the bounds below the node (accounts for the extra width)
  const xOffset = (boundsWidth - nodeWidth) / 2;
  // Y is 10pt below the input node lower bound
  const boundsY = nodeY + nodeHeight + 10;
  
  const bounds = {
    topLeft: { x: nodeX - xOffset, y: boundsY },
    topRight: { x: nodeX + nodeWidth + xOffset, y: boundsY },
    bottomLeft: { x: nodeX - xOffset, y: boundsY + boundsHeight },
    bottomRight: { x: nodeX + nodeWidth + xOffset, y: boundsY + boundsHeight }
  };

  // Use the debug mode setting if showVisually is not explicitly provided
  if (showVisually === undefined) {
    showVisually = useSettingsStore.getState().debugMode;
  }

  // Update the bounds in the store
  useBoundsStore.getState().setBounds(bounds, showVisually);

  return bounds;
};

/**
 * Creates a bounded area to the left of a given element and updates the global bounds store
 */
export const createBoundsLeftOfNode = (element: ReactFlowNode | HTMLElement, showVisually?: boolean): Bounds => {
  if (!element) {
    const defaultBounds = useBoundsStore.getState().defaultBounds;
    return defaultBounds;
  }
  
  const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = getElementDimensions(element);

  // Width is 80% of the node width (matching the right bounds pattern)
  const boundsWidth = nodeWidth * 0.8;
  const boundsHeight = nodeHeight;
  // X is 10pt to the left of the input node left bound
  const boundsX = nodeX - boundsWidth - 10;
  // Y is centered to the node
  const boundsY = nodeY + (nodeHeight / 2) - (boundsHeight / 2);
  
  const bounds = {
    topLeft: { x: boundsX, y: boundsY },
    topRight: { x: boundsX + boundsWidth, y: boundsY },
    bottomLeft: { x: boundsX, y: boundsY + boundsHeight },
    bottomRight: { x: boundsX + boundsWidth, y: boundsY + boundsHeight }
  };
  
  // Use the debug mode setting if showVisually is not explicitly provided
  if (showVisually === undefined) {
    showVisually = useSettingsStore.getState().debugMode;
  }

  // Update the bounds in the store  
  useBoundsStore.getState().setBounds(bounds, showVisually);
  
  return bounds;
};

/**
 * Sets custom bounds and updates the global store
 */
export const setBounds = (bounds: Bounds, showVisually?: boolean): void => {
  // Use the debug mode setting if showVisually is not explicitly provided
  if (showVisually === undefined) {
    showVisually = useSettingsStore.getState().debugMode;
  }

  useBoundsStore.getState().setBounds(bounds, showVisually);
};

/**
 * Sets bounds and ensures visibility is enabled
 */
export const setBoundsAndShow = (bounds: Bounds): void => {
  useBoundsStore.getState().setBounds(bounds, true);
};

/**
 * Hide the visual boundary indicator without changing the bounds
 */
export const hideBoundaryIndicator = (): void => {
  useBoundsStore.getState().setShowBounds(false);
};

/**
 * Show the visual boundary indicator for current bounds
 */
export const showBoundaryIndicator = (): void => {
  useBoundsStore.getState().setShowBounds(true);
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
    Math.abs(position.x - node.position.x) < THOUGHT_NODE_DIMENSIONS.WIDTH + (THOUGHT_NODE_DIMENSIONS.WIDTH * buffer) &&
    Math.abs(position.y - node.position.y) < THOUGHT_NODE_DIMENSIONS.HEIGHT + (THOUGHT_NODE_DIMENSIONS.HEIGHT * buffer)
  );
}; 
