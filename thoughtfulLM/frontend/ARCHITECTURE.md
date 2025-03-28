# ThoughtKit Frontend Architecture

This document provides a detailed overview of the ThoughtKit frontend architecture, explaining the layered approach, data flow, and interaction patterns.

## Layered Architecture

ThoughtKit's frontend follows a clean, multi-layered architecture to ensure separation of concerns:

```
┌────────────────────────────────────────────────────────────────┐
│                          UI Layer                              │
│                                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ TextInputNode │  │ThoughtBubbleNode│  │ ResponseNode │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  Canvas (ReactFlow)                     │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Visualization Layer                          │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                     NodeStore                           │   │
│  │  - Single source of truth for ReactFlow nodes           │   │
│  │  - Typed node data (ThoughtNodeData, InputNodeData)     │   │
│  │  - Node operations (add, update, remove, position)      │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     Connector Layer                             │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  nodeConnectors.ts                      │   │
│  │  - Create: createThoughtNode, createInputNode           │   │
│  │  - Delete: deleteThoughtNode, deleteInputNode           │   │
│  │  - Update: updateThoughtNode, updateInputNode           │   │
│  │  - Position: repositionNode, repositionNodeByEntityId   │   │
│  │  - State: markNodeForRemoval                            │   │
│  │  - Consistency: ensureNodesForThoughts                  │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│                                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ ThoughtStore  │  │  InputStore   │  │  MemoryStore  │      │
│  │ - API calls   │  │ - Text state  │  │ - Context     │      │
│  │ - Thought data│  │ - Triggers    │  │ - History     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Thought Generation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Input  │────►│  InputStore │────►│ API Request │────►│ThoughtStore │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Canvas    │◄────│  NodeStore  │◄────│NodeConnector│◄────│  Thought    │
│  (ReactFlow) │     │             │     │             │     │  Created    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. User types in input field
2. InputStore tracks text changes and detects triggers
3. Trigger causes API request to backend
4. ThoughtStore creates thought based on API response
5. NodeConnector createThoughtNode called
6. NodeStore adds node with proper data type
7. Canvas renders updated node

### 2. Node Interaction Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Drags  │────►│   Canvas    │────►│  NodeStore  │
│    Node      │     │  (ReactFlow) │     │  (position) │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User drags node on canvas
2. Canvas (ReactFlow) updates node position
3. NodeStore position is updated through onNodesChange

### 3. Data Integrity Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ThoughtStore │────►│  Thoughts   │────►│ensureNodesFor│────►│  NodeStore  │
│  Updates    │     │   Change    │     │  Thoughts    │     │ Creates Node│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. ThoughtStore updates (new thoughts added)
2. Canvas detects thought changes
3. ensureNodesForThoughts called
4. NodeStore creates visualization for any missing thoughts

### 4. Deletion Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Click  │────►│NodeConnector│────►│markNodeForRemoval│
│  Delete Node │     │deleteThoughtNode│  │  (animation)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
                     ┌─────────────┐     ┌─────────────┐
                     │ThoughtStore │◄────│  NodeStore  │
                     │removeThought│     │ removeNode  │
                     └─────────────┘     └─────────────┘
```

1. User clicks delete on node
2. NodeConnector deleteThoughtNode called
3. markNodeForRemoval triggers animation
4. After animation, NodeStore removeNode called
5. ThoughtStore removeThought called

## Store Structure

### NodeStore

```
NodeStore
├── nodes: Node[] (ReactFlow node type)
│   ├── ThoughtNode
│   │   ├── id: string
│   │   ├── type: 'thoughtBubble'
│   │   ├── position: {x: number, y: number}
│   │   └── data: ThoughtNodeData
│   │       ├── thought: Thought
│   │       ├── isRemoving: boolean
│   │       └── blobVariant: number
│   ├── InputNode
│   │   ├── id: string
│   │   ├── type: 'textInput'
│   │   ├── position: {x: number, y: number}
│   │   └── data: InputNodeData
│   │       ├── inputId: string
│   │       └── isActive: boolean
│   └── ResponseNode
│       ├── id: string
│       ├── type: 'response'
│       ├── position: {x: number, y: number}
│       └── data: ResponseNodeData
│           ├── responseId: string
│           └── responseText: string
├── Methods
│   ├── addNode(node: Node): void
│   ├── updateNodeData(nodeId: string, data: Partial<NodeData>): void
│   ├── setNodes(nodes: Node[]): void
│   ├── removeNode(nodeId: string): void
│   └── getNodes(): Node[]
```

### ThoughtStore

```
ThoughtStore
├── thoughts: Thought[]
│   ├── id: string
│   ├── content: {text: string}
│   ├── weight: number
│   └── persistent: boolean
├── Methods
│   ├── generateThought(trigger: string, position: Position): Promise<Thought>
│   ├── addThought(thought: Thought): void
│   ├── removeThought(thoughtId: string): void
│   ├── updateThought(thoughtId: string, updates: Partial<Thought>): void
│   └── getThoughts(): Thought[]
```

### InputStore

```
InputStore
├── inputs: Input[]
│   ├── id: string
│   ├── text: string
│   ├── position: {x: number, y: number}
│   └── active: boolean
├── Methods
│   ├── addInput(input: Input): void
│   ├── removeInput(inputId: string): void
│   ├── updateInput(inputId: string, text: string): void
│   ├── setActiveInput(inputId: string): void
│   └── getInputs(): Input[]
```

## Node Types and Components

### ThoughtBubbleNode

- Visual representation of AI thoughts
- Displays thought content
- Manages hover interactions
- Handles animation for appearance/removal

### TextInputNode

- User input fields
- Manages text entry
- Detects triggers for thought generation
- Handles focus state

### ResponseNode

- AI responses to user input
- Animated text appearance
- Auto-sizing based on content

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

## Data Consistency

The Canvas component directly monitors changes in the ThoughtStore and ensures that every thought has a corresponding node visualization:

```typescript
// In Canvas.tsx
const thoughts = useThoughtStore(state => state.thoughts);

// Ensure nodes exist for all thoughts when component mounts or thoughts change
useEffect(() => {
  ensureNodesForThoughts();
}, [thoughts]);
```

This approach maintains data integrity between the data layer and visualization layer without complex synchronization mechanisms.

## Future Architecture Improvements

1. **Event System**: Implement a more robust event system for cross-layer communication
2. **Optimistic Updates**: Add optimistic updates for smoother UI during API operations
3. **Node Type Abstraction**: Further abstract node types for easier addition of new node types
4. **Server State Management**: Integrate a dedicated server state management solution
5. **Testing Infrastructure**: Add comprehensive test coverage for all layers 