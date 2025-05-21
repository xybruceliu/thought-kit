import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MessageProps } from '../components/chat/Message';

interface ChatStoreState {
  // Data
  messages: MessageProps[];
  isProcessing: boolean;
  
  // Actions
  addUserMessage: (content: string) => void;
  addAIResponse: (content: string, relatedThoughtIds?: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  // Initial state
  messages: [],
  isProcessing: false,
  
  // Add a user message to the chat
  addUserMessage: (content: string) => {
    const message: MessageProps = {
      content,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    set(state => ({
      messages: [...state.messages, message]
    }));
  },
  
  // Add an AI response to the chat
  addAIResponse: (content: string, relatedThoughtIds?: string[]) => {
    const message: MessageProps = {
      content,
      sender: 'ai',
      timestamp: Date.now(),
      relatedThoughtIds,
    };
    
    set(state => ({
      messages: [...state.messages, message],
      isProcessing: false
    }));
  },
  
  // Set the processing state (e.g., when waiting for an AI response)
  setIsProcessing: (isProcessing: boolean) => {
    set({ isProcessing });
  },
  
  // Clear all messages
  clearMessages: () => {
    set({ messages: [] });
  },
})); 