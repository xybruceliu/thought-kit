# ThoughtKit Frontend Architecture

This document provides an overview of the ThoughtKit frontend architecture, explaining the layered approach, data flow, and interaction patterns.

## Layered Architecture

ThoughtKit's frontend follows a multi-layered architecture to ensure separation of concerns:

```
┌───────────────────────────────────────────────────────┐
│                     UI Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │TextInputNode│  │ThoughtBubble│  │ResponseNode│      │
│  └────────────┘  └────────────┘  └────────────┘      │
│  ┌───────────────────────────────────────────┐       │
│  │            Canvas (ReactFlow)              │       │
│  └───────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────┘
                        ▲
                        ▼
┌───────────────────────────────────────────────────────┐
│               Visualization Layer                     │
│  ┌───────────────────────────────────────────┐       │
│  │                NodeStore                   │       │
│  │  - Source of truth for ReactFlow nodes     │       │
│  │  - Typed node data and operations          │       │
│  └───────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────┘
                        ▲
                        ▼
┌───────────────────────────────────────────────────────┐
│                 Connector Layer                       │
│  ┌───────────────────────────────────────────┐       │
│  │             nodeConnectors.ts              │       │
│  │  - Create/Delete/Update node functions     │       │
│  │  - Position management functions           │       │
│  │  - Data consistency functions              │       │
│  └───────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────┘
                        ▲
                        ▼
┌───────────────────────────────────────────────────────┐
│                   Data Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │ThoughtStore│  │ InputStore │  │MemoryStore │      │
│  └────────────┘  └────────────┘  └────────────┘      │
└───────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Thought Generation Flow

User input → InputStore → API Request → ThoughtStore → NodeConnector → NodeStore → Canvas

1. User types in input field
2. InputStore detects triggers
3. API request sent to backend
4. ThoughtStore creates thought
5. NodeConnector createThoughtNode called
6. NodeStore adds node
7. Canvas renders node

### 2. Node Interaction Flow

User Interaction → Canvas → NodeStore

1. User drags node on canvas
2. Canvas updates node position
3. NodeStore position updated

### 3. Data Integrity Flow

ThoughtStore → Thoughts Change → ensureNodesForThoughts → NodeStore

1. ThoughtStore updates
2. Canvas detects thought changes
3. ensureNodesForThoughts called
4. NodeStore creates missing nodes

### 4. Deletion Flow

User Click → NodeConnector → Animation → NodeStore → ThoughtStore

1. User clicks delete on node
2. NodeConnector deleteThoughtNode called
3. Animation plays via markNodeForRemoval
4. NodeStore removes node
5. ThoughtStore removes thought

## Store Structure

### NodeStore
- Stores ReactFlow nodes with typed data
- Handles node operations (add, update, remove, position)

### ThoughtStore
- Manages thought data
- Handles API calls
- Maintains thought properties

### InputStore
- Tracks text input state
- Detects input triggers 

### MemoryStore
- Maintains context for thought generation

## Node Types and Components

- **ThoughtBubbleNode**: Visualizes AI thoughts
- **TextInputNode**: Handles user input
- **ResponseNode**: Displays AI responses

## Data Consistency

The Canvas component monitors ThoughtStore changes to ensure every thought has a corresponding visualization:

```typescript
// In Canvas.tsx
const thoughts = useThoughtStore(state => state.thoughts);

// Ensure nodes exist for all thoughts
useEffect(() => {
  ensureNodesForThoughts();
}, [thoughts]);
```

## Connector Functions

The nodeConnectors.ts file serves as a bridge between data and visualization layers:

| Function | Description |
|----------|-------------|
| createThoughtNode | Creates visualization node from thought data |
| createInputNode | Creates visualization node for text input |
| createResponseNode | Creates visualization node for AI response |
| deleteThoughtNode | Handles removal animation and deletion |
| updateThoughtNode | Updates node data with thought changes |
| repositionNode | Updates node position by node ID |
| repositionNodeByEntityId | Updates node position by entity ID |
| markNodeForRemoval | Initiates removal animation |
| ensureNodesForThoughts | Creates nodes for thoughts without visualization |
| doesNodeExistByEntityId | Checks if visualization exists for data entity |
| getNodeByEntityId | Retrieves node by associated entity ID |

