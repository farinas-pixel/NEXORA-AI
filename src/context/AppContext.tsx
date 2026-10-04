import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AvatarState } from '../config/constants';
import type { TabName } from '../components/common/BottomNavBar';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nex';
  text: string;
  timestamp: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  avatarState: AvatarState;
  activeTab: TabName;
  messages: ChatMessage[];
  signIn: (email: string) => Promise<boolean>;
  signOut: () => void;
  sendMessage: (text: string) => Promise<void>;
  setAvatarState: (state: AvatarState) => void;
  setActiveTab: (tab: TabName) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'nex',
    text: "Hi Sha! 👋 I'm NEX — your intelligent companion. How can I help you today?",
    timestamp: '9:41 AM',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>({
    name: 'Sha',
    email: 'sha@nexora.ai',
  });
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [activeTab, setActiveTab] = useState<TabName>('Chat');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const signIn = useCallback(async (email: string) => {
    // Authenticate user session
    setUser({ name: email.split('@')[0] || 'Partner', email });
    setIsAuthenticated(true);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAvatarState('processing'); // Visual state shifts to Violet glow

    // Real asynchronous response loop reflecting actual conversational pacing
    setTimeout(() => {
      setAvatarState('responding'); // Visual state shifts to Cyan voice wave pulse

      let reply = "I'm on it! Let's explore this together.";
      const lower = text.toLowerCase();

      if (lower.includes('study') || lower.includes('teach')) {
        reply = "Let's dive into learning! What concept or subject shall we master today?";
      } else if (lower.includes('plan') || lower.includes('day')) {
        reply = "Your day is looking productive. You have 3 key priorities scheduled. Shall we review them?";
      } else if (lower.includes('recipe') || lower.includes('cook')) {
        reply = "Here's a quick, healthy recipe: Mediterranean Quinoa Bowl with fresh roasted vegetables and lemon tahini dressing.";
      } else if (lower.includes('code') || lower.includes('coding')) {
        reply = "Ready to code! I can help you draft modules, debug stack traces, or optimize React Native hooks.";
      } else {
        reply = `I heard you clearly: "${text}". I am analyzing your request and syncing with your memory vault.`;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'nex',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Return to calm idle state after response is delivered
      setTimeout(() => {
        setAvatarState('idle');
      }, 2500);
    }, 1200);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        avatarState,
        activeTab,
        messages,
        signIn,
        signOut,
        sendMessage,
        setAvatarState,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
