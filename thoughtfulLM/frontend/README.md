# ThoughtfulLM Frontend

A React application that provides a canvas-based interface for the ThoughtKit library, visualizing AI thoughts as interactive bubbles on a canvas.

## Tech Stack

- **Frontend**:
  - React (with TypeScript)
  - Chakra UI (for UI components)
  - React Flow (for the canvas/whiteboard)
  - Axios (for API requests)

- **State Management**:
  - Zustand

## Project Structure

```
thoughtfulLM/frontend/
├── src/
│   ├── api/                 # API service layer
│   │   └── thoughtApi.ts    # Functions for backend communication
│   ├── components/          # React components
│   │   ├── Canvas.tsx       # Main canvas component using ReactFlow
│   │   ├── TextInputNode.tsx # Text input node component
│   │   ├── ThoughtBubbleNode.tsx # Thought bubble node component
│   │   ├── ResponseNode.tsx # Response node component
│   │   └── index.ts         # Component exports
│   ├── store/               # State management (Zustand)
│   │   ├── nodeStore.ts     # Unified store for all node types
│   │   ├── thoughtStore.ts  # Store for thought data
│   │   ├── inputStore.ts    # Store for input data
│   │   └── memoryStore.ts   # Store for memory context
│   ├── types/               # TypeScript type definitions
│   │   └── thought.ts       # Types for thought-related data
│   ├── hooks/               # Custom React hooks
│   │   ├── nodeConnectors.ts # Connector functions between data and visualization
│   │   ├── useTriggerDetection.ts # Hook for detecting input triggers
│   │   └── index.ts         # Hook exports
│   ├── utils/               # Utility functions
│   │   ├── nodePositioning.ts # Node positioning strategies
│   │   └── index.ts         # Utility exports
│   └── assets/              # Static assets
├── public/                  # Public assets
├── package.json             # NPM dependencies
└── README.md                # Documentation
```

## Architecture Overview

The application follows a clean, layered architecture with clear separation of concerns:

1. **Data Layer**: Manages the application data
   - `thoughtStore.ts`: Manages thought content and properties
   - `inputStore.ts`: Manages input field state and text
   - `memoryStore.ts`: Manages memory and context

2. **Connector Layer**: Bridges data and visualization
   - `nodeConnectors.ts`: Functions that connect data operations to visualization

3. **Visualization Layer**: Manages the UI representation
   - `nodeStore.ts`: Single source of truth for ReactFlow nodes
   - `Canvas.tsx`: ReactFlow canvas as a controlled component

## State Management Architecture

### Stores

- **NodeStore**: Unified store for all visual nodes (thoughtBubble, textInput, response)
  - Single source of truth for visualization including node positions
  - Contains properly typed node data for each node type
  - Manages node operations (add, update, remove, position)

- **ThoughtStore**: Manages thought data and operations
  - Handles API calls to generate thoughts
  - Manages thought properties (weight, persistence, etc.)
  - Contains thought-specific business logic

- **InputStore**: Manages input field data
  - Tracks text input state
  - Manages input triggers and baselines
  - Tracks active input node

### Data Flow

1. **User Input → Thought Generation → Visualization**:
   ```
   User types → InputStore updated → Trigger detected → 
   API call via ThoughtStore → Thought created → 
   createThoughtNode called → Node added to NodeStore → 
   ReactFlow renders the node
   ```

2. **User Interaction with Nodes**:
   ```
   User drags node → ReactFlow updates → 
   NodeStore position updated → ReactFlow renders updated position
   ```

3. **Data Integrity**:
   ```
   Thoughts change in ThoughtStore → ensureNodesForThoughts → 
   Missing nodes created in NodeStore → ReactFlow renders new nodes
   ```

4. **Node Deletion**:
   ```
   User clicks delete → deleteThoughtNode called → 
   markNodeForRemoval → Animation plays → 
   NodeStore.removeNode called → ThoughtStore updated
   ```

## Connector Functions

The nodeConnectors.ts file provides a clean API for operations between data and visualization:

- **Create Functions**: createThoughtNode, createInputNode, createResponseNode
- **Delete Functions**: deleteThoughtNode, deleteInputNode, deleteResponseNode
- **Update Functions**: updateThoughtNode, updateInputNode, updateResponseNode
- **Position Functions**: repositionNode, repositionNodeByEntityId
- **State Functions**: markNodeForRemoval
- **Utility Functions**: doesNodeExistByEntityId, getNodeByEntityId
- **Consistency Functions**: ensureNodesForThoughts

## Code Examples

### Creating a Thought Node

```typescript
// 1. Generate thought in ThoughtStore
const thought = await thoughtStore.generateThought('SENTENCE_END', position);

// 2. Create visualization using connector function
const node = createThoughtNode(thought, position);
```

### Updating Input Text

```typescript
// Update text in input store
useInputStore.getState().updateInput(inputId, newText);

// If needed, update node data using connector
updateInputNode(inputId, { /* any additional properties */ });
```

### Deleting a Thought

```typescript
// Use connector function to handle both visual and data removal
deleteThoughtNode(thoughtId);

// This internally handles:
// 1. Animation via markNodeForRemoval
// 2. Removal from NodeStore
// 3. Removal from ThoughtStore
```

### Position Management

```typescript
// Update position by node ID
repositionNode(nodeId, newPosition);

// Update position by entity ID
repositionNodeByEntityId('thought', thoughtId, newPosition);
```

### Ensuring Data Consistency

```typescript
// Ensure visualization nodes exist for all thoughts
ensureNodesForThoughts();
```

## Development

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Features to be implemented

- Canvas/whiteboard interface with draggable nodes
- Text input for generating thoughts
- Thought bubbles displaying generated thoughts
- Ability to perform operations on thoughts
- Thought articulation
