import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Send,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Scale,
  Loader,
  Bot,
  User,
} from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import VoiceInput from '../components/VoiceInput';
import LanguageSelector from '../components/LanguageSelector';
import { getTranslation } from '../translations';
import api from '../utils/axiosConfig';

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const { language, speak } = useAccessibility();
  const t = getTranslation(language);

  // ── Chat state ──
  const [chatHistory, setChatHistory]   = useState([]);   // [{ role: 'user'|'bot', content }]
  const [inputText, setInputText]       = useState('');
  const [category, setCategory]         = useState('');
  const [isSending, setIsSending]       = useState(false);
  const [showExamples, setShowExamples] = useState(true); // hide once chat starts
  const messagesEndRef                  = useRef(null);

  // Example queries in current language
  const examples = [
    t.voice.examples.property,
    t.voice.examples.divorce,
    t.voice.examples.business,
    t.voice.examples.accident,
  ];

  // ── Welcome message on mount ──
  useEffect(() => {
    speak(t.voice.subtitle);
  }, [language]);

  // ── Auto-scroll to latest message ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Voice input updates the text box ──
  const handleTranscriptChange = (transcript) => {
    setInputText(transcript);
  };

  // ── Send a message to the chatbot ──
  const sendMessage = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isSending) return;

    // Optimistically add user message
    const userMsg = { role: 'user', content: trimmed };
    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setShowExamples(false);
    setIsSending(true);

    try {
      // Build the history array the server expects (role + content only)
      const historyForServer = [...chatHistory, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post('/api/voice/chat', {
        message: trimmed,
        history: historyForServer,
        language,
      });

      if (res.data.success) {
        const botMsg = { role: 'bot', content: res.data.response };
        setChatHistory(prev => [...prev, botMsg]);
        // Speak the response aloud
        speak(res.data.response.replace(/[*⚠️💡🔹]/g, ''));
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'bot', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // ── User presses Send or hits Enter ──
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    sendMessage(inputText);
  };

  // ── User clicks an example query ──
  const handleExampleClick = (example) => {
    setInputText(example);
    speak(example);
    sendMessage(example);
  };

  // ── Also submit the selected category if the user picked one ──
  const handleCategorySubmit = () => {
    if (category && !inputText) {
      sendMessage(`I need help with a ${category} law issue.`);
    }
  };

  // ── Render a single chat bubble ──
  const renderBubble = (msg, index) => {
    const isBot  = msg.role === 'bot';
    const lines  = msg.content.split('\n');

    return (
      <div
        key={index}
        className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'} animate-in slide-in-from-bottom-2 duration-200`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
            isBot ? 'bg-blue-600' : 'bg-indigo-500'
          }`}
        >
          {isBot ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
        </div>

        {/* Bubble */}
        <div className={`max-w-[80%] ${isBot ? 'items-start' : 'items-end'} flex flex-col`}>
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm ${
              isBot
                ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none'
            }`}
          >
            {lines.map((line, i) => {
              // Bold lines (wrapped in **)
              const boldMatch = line.match(/^\*\*(.+)\*\*$/);
              if (boldMatch) {
                return <p key={i} className="text-sm font-bold mb-1">{boldMatch[1]}</p>;
              }
              // Numbered items ("  1. …")
              if (/^\s+\d+\./.test(line)) {
                return <p key={i} className="text-sm ml-2">{line.trim()}</p>;
              }
              // Empty line → small spacer
              if (!line.trim()) return <div key={i} className="h-1" />;
              // Default
              return <p key={i} className="text-sm leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-gray-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="hover:bg-gray-800 p-2 rounded transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6" />
              <span className="text-xl font-semibold">{t.voice.title}</span>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-6 overflow-hidden">

        {/* Title – only show when chat hasn't started */}
        {showExamples && (
          <>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.voice.title}</h1>
              <p className="text-gray-600">{t.voice.subtitle}</p>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 p-2 rounded-full">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{t.voice.instructions}</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li><span className="text-blue-600 font-bold">1.</span> Use the mic or type your legal question below</li>
                    <li><span className="text-blue-600 font-bold">2.</span> The assistant will ask follow-up questions</li>
                    <li><span className="text-blue-600 font-bold">3.</span> No legal jargon needed — use simple words</li>
                    <li><span className="text-blue-600 font-bold">4.</span> A matching lawyer will be connected to your case</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Category selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
              <label className="block text-base font-semibold text-gray-900 mb-3">
                Type of Legal Issue (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(t.legalCategories).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => { setCategory(key); }}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                      category === key
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Example queries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-semibold text-gray-900">{t.voice.examples.title}</h3>
              </div>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{example}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Chat bubbles (scrollable) ── */}
        {chatHistory.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
            {chatHistory.map((msg, i) => renderBubble(msg, i))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ── Voice input (mic button) ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
          <VoiceInput onTranscriptChange={handleTranscriptChange} placeholder={t.voice.placeholder} />
        </div>

        {/* ── Text input + Send ── */}
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
            placeholder={t.voice.placeholder || 'Type your legal question…'}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
          >
            {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSending ? t.voice.processing || 'Sending…' : t.voice.submit || 'Send'}</span>
          </button>
        </form>

        {/* If user picked a category but hasn't typed anything, nudge them */}
        {category && !inputText && showExamples && (
          <button
            onClick={handleCategorySubmit}
            className="mt-3 text-sm text-blue-600 hover:underline self-center"
          >
            → Start with "{category}" category
          </button>
        )}

        {/* Privacy notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 text-center">
            🔒 Your information is secure and confidential. We will only share it with verified lawyers who can help you.
          </p>
        </div>
      </main>
    </div>
  );
}