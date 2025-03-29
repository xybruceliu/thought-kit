# ThoughtfulLM Frontend

A React application that provides a canvas-based interface for the ThoughtKit library, visualizing AI thoughts as interactive bubbles on a canvas.

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Chakra UI for UI components
  - React Flow for the canvas/whiteboard
  - Axios for API requests
- **State Management**: Zustand

## Project Structure

```
thoughtfulLM/frontend/
├── src/
│   ├── api/                 # API service layer
│   ├── components/          # React components
│   ├── store/               # State management (Zustand)
│   ├── types/               # TypeScript type definitions
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── assets/              # Static assets
├── public/                  # Public assets
└── package.json             # NPM dependencies
```

## Architecture Overview

The application follows a three-layer architecture:

1. **Data Layer**: Manages application data
   - `thoughtStore.ts`: Thought content and properties
   - `inputStore.ts`: Input field state and text
   - `memoryStore.ts`: Memory and context

2. **Connector Layer**: Bridges data and visualization
   - `nodeConnectors.ts`: Functions connecting data to visualization

3. **Visualization Layer**: Manages UI representation
   - `nodeStore.ts`: Single source of truth for ReactFlow nodes
   - `Canvas.tsx`: ReactFlow canvas as a controlled component

## State Management

### Stores

- **NodeStore**: Manages all visual nodes and their positions
- **ThoughtStore**: Handles thought data and API operations
- **InputStore**: Manages input field data and triggers
- **MemoryStore**: Maintains memory context for thought generation

### Data Flow

1. **User Input → Thought Generation → Visualization**
2. **User Interaction with Nodes → Position Updates**
3. **Data Integrity**: Ensuring all thoughts have visual representations
4. **Node Deletion**: Animation and cleanup

## Node Types

- **TextInputNode**: User input fields
- **ThoughtBubbleNode**: Visualizations of AI thoughts
- **ResponseNode**: AI responses with animations

## Development

1. Install dependencies:
```
npm install
```

2. Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
```

3. Start the development server:
```
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

For more detailed information about the architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).
