// client/src/components/ChatEntryButton.jsx
// Drop this component anywhere to show a "Chat with AI Lawyer" button.
// Usage in ClientDashboard: <ChatEntryButton />
// Usage in VoiceAssistantPage after transcription: <ChatEntryButton transcript={transcript} />

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function ChatEntryButton({ transcript = null, variant = 'floating' }) {
  const navigate = useNavigate();

  const goToChat = () => {
    navigate('/chat', transcript ? { state: { transcript } } : undefined);
  };

  // ── Floating button (bottom-right corner, always visible on dashboard)
  if (variant === 'floating') {
    return (
      <button
        onClick={goToChat}
        title="Chat with AI Legal Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #b45309, #1c1917)', boxShadow: '0 8px 32px rgba(180,83,9,0.35)' }}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm">Ask AI Lawyer</span>
        <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3" />
          AI
        </span>
      </button>
    );
  }

  // ── Inline card button (use inside dashboard sections)
  if (variant === 'card') {
    return (
      <button
        onClick={goToChat}
        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-all duration-200 group"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #d97706, #92400e)' }}>
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-stone-800 group-hover:text-amber-800 transition-colors">
            Chat with AI Legal Assistant
          </p>
          <p className="text-sm text-stone-500">
            Describe your issue, answer a few questions, get matched with a lawyer
          </p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
            <Sparkles className="w-3 h-3" />
            Ollama AI
          </span>
        </div>
      </button>
    );
  }

  // ── Small inline button (e.g. in VoiceAssistantPage after transcription)
  if (variant === 'inline') {
    return (
      <button
        onClick={goToChat}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #b45309, #292524)' }}
      >
        <MessageSquare className="w-4 h-4" />
        {transcript ? 'Continue in AI Chat' : 'Open AI Chat'}
      </button>
    );
  }

  return null;
}