import React from 'react';
import { useStore } from 'reactflow';
import { useBoundsStore } from '../store/boundsStore';

/**
 * Component that displays the current boundaries on the canvas
 * Shows a simple dashed rectangle around the defined bounds
 */
const BoundaryIndicator: React.FC = () => {
  // Get the current bounds and showBounds flag from the store
  const bounds = useBoundsStore(state => state.currentBounds);
  const showBounds = useBoundsStore(state => state.showBounds);
  
  // Get the transform values directly from ReactFlow store
  // This will re-render the component whenever these values change
  const transform = useStore((state) => state.transform);
  
  // If no bounds are set or showBounds is false, don't render anything
  if (!bounds || !showBounds) return null;
  
  const { topLeft, bottomRight } = bounds;
  
  // Calculate the width and height of the bounds
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  
  // Apply the zoom scale to position correctly with the canvas
  const [x, y, scale] = transform;
  const transformedX = topLeft.x * scale + x;
  const transformedY = topLeft.y * scale + y;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: transformedX,
        top: transformedY,
        width: width * scale,
        height: height * scale,
        border: '2px dashed rgba(75, 192, 192, 0.7)',
        pointerEvents: 'none', // Makes sure this doesn't interfere with interactions
        zIndex: 5, // Ensure it's above the canvas but below nodes
        borderRadius: '5px',
        backgroundColor: 'rgba(75, 192, 192, 0.1)'
      }}
    />
  );
};

export default BoundaryIndicator; 