# ThoughtfulLM Frontend

A React application that provides a canvas-based interface for the ThoughtKit library.

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
│   │   └── index.ts         # Component exports
│   ├── store/               # State management (Zustand)
│   │   └── thoughtStore.ts  # Global state for thoughts
│   ├── types/               # TypeScript type definitions
│   │   └── thought.ts       # Types for thought-related data
│   ├── hooks/               # Custom React hooks
│   │   └── index.ts         # Hook exports
│   ├── utils/               # Utility functions
│   │   └── index.ts         # Utility exports
│   └── assets/              # Static assets
├── public/                  # Public assets
├── package.json             # NPM dependencies
└── README.md                # Documentation
```

## Folder Structure

- `src/api`: API service for interacting with the backend
- `src/components`: React components for the UI
- `src/hooks`: Custom React hooks
- `src/store`: Zustand state management
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
- `src/assets`: Static assets

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
